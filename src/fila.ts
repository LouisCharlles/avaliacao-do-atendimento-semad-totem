import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import { obterConfig } from './configuracao';
import type { Respostas } from './domain';

/**
 * Fila offline: toda avaliação é gravada no aparelho antes do envio. Se a rede cair, ela é
 * reenviada depois. O clientId (UUID) torna o reenvio idempotente na API.
 *
 * Envio: em lotes (POST /api/avaliacoes/lote). Se o servidor não tiver a rota de lote (versão
 * antiga da API), cai para o envio de uma avaliação por vez.
 *
 * Quando enviar: logo após cada avaliação, quando a rede volta (NetInfo), quando o app volta
 * ao primeiro plano e, como reserva, a cada 30 s. Se o envio falhar, o intervalo dobra
 * (30 s → 1 → 2 → 4 → 5 min), com uma variação aleatória. Um 429 respeita o Retry-After.
 */
export interface AvaliacaoPendente {
  clientId: string;
  totemId: string;
  respondidoEm: string;
  setor: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: string;
  comentario?: string;
}

const CHAVE = '@semad/fila';
const LIMITE = 5000;
const TAMANHO_LOTE = 50; // a API aceita até 100
const TIMEOUT_MS = 15_000;
const INTERVALO_BASE_MS = 30_000;
const INTERVALO_MAXIMO_MS = 5 * 60_000;

async function ler(): Promise<AvaliacaoPendente[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(CHAVE)) ?? '[]');
  } catch {
    return [];
  }
}

async function gravar(lista: AvaliacaoPendente[]) {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista.slice(-LIMITE)));
}

/** Tira da fila os itens confirmados. Relê antes para não perder avaliações feitas durante o envio. */
async function remover(ids: Set<string>) {
  if (!ids.size) return;
  const atual = await ler();
  await gravar(atual.filter((i) => !ids.has(i.clientId)));
}

export async function pendentes(): Promise<number> {
  return (await ler()).length;
}

export async function enfileirar(r: Required<Omit<Respostas, 'comentario'>> & { comentario?: string }) {
  const item: AvaliacaoPendente = {
    clientId: Crypto.randomUUID(),
    totemId: obterConfig().totemId,
    respondidoEm: new Date().toISOString(),
    setor: r.setor,
    q1: r.q1,
    q2: r.q2,
    q3: r.q3,
    q4: r.q4,
    q5: r.q5,
    comentario: r.comentario?.trim() || undefined,
  };
  const lista = await ler();
  lista.push(item);
  await gravar(lista);
  // Envia em segundo plano; a tela de agradecimento não espera a rede.
  // Em backoff, não insiste: o agendador (ou a volta da rede) cuida do envio.
  if (falhasSeguidas === 0) executar().catch(() => undefined);
}

// ---------------------------------------------------------------------------------------------
// Envio

/** Falha que vale tentar de novo depois (sem rede, servidor fora, 5xx, 401, 429…). */
type Falha = { falhou: true; esperarMs?: number };

async function post(caminho: string, corpo: unknown): Promise<Response | Falha> {
  const { apiUrl, chave } = obterConfig();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${apiUrl}${caminho}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Totem-Key': chave },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    });
  } catch {
    return { falhou: true };
  } finally {
    clearTimeout(t);
  }
}

function ehFalha(r: Response | Falha): r is Falha {
  return 'falhou' in r;
}

/** Converte o Retry-After (segundos ou data HTTP) de uma resposta 429 em milissegundos. */
function retryAfterMs(res: Response): number | undefined {
  const v = res.headers.get('retry-after');
  if (!v) return undefined;
  const seg = Number(v);
  if (Number.isFinite(seg)) return Math.max(0, seg * 1000);
  const data = Date.parse(v);
  return Number.isNaN(data) ? undefined : Math.max(0, data - Date.now());
}

function falhaDe(res: Response): Falha {
  return { falhou: true, esperarMs: res.status === 429 ? retryAfterMs(res) : undefined };
}

/**
 * Envia um item sozinho. Retorna true se ele pode sair da fila (gravado, já existia ou
 * inválido: 400 não se resolve reenviando e travaria a fila).
 */
async function enviarUm(item: AvaliacaoPendente): Promise<true | Falha> {
  const res = await post('/api/avaliacoes', item);
  if (ehFalha(res)) return res;
  if (res.ok || res.status === 400) return true;
  return falhaDe(res);
}

type ResultadoLote = { clientId: string | null; status: 'aceita' | 'duplicada' | 'invalida' };

/**
 * Envia um lote. Retorna os clientIds que podem sair da fila, 'sem-lote' se o servidor não
 * aceita lote (rota inexistente, corpo grande demais, formato recusado) ou uma falha.
 */
async function enviarLote(itens: AvaliacaoPendente[]): Promise<Set<string> | 'sem-lote' | Falha> {
  const res = await post('/api/avaliacoes/lote', { totemId: obterConfig().totemId, avaliacoes: itens });
  if (ehFalha(res)) return res;
  if (res.status === 404 || res.status === 413 || res.status === 400) return 'sem-lote';
  if (!res.ok) return falhaDe(res);
  try {
    const { resultados } = (await res.json()) as { resultados?: ResultadoLote[] };
    const confirmados = new Set<string>();
    // Confere índice e clientId: só remove o que o servidor respondeu sobre aquele item.
    itens.forEach((item, i) => {
      if (resultados?.[i]?.clientId === item.clientId) confirmados.add(item.clientId);
    });
    return confirmados;
  } catch {
    return { falhou: true };
  }
}

type Desfecho = { restantes: number; falha?: Falha };

/** Envia o que estiver pendente, em ordem. Para na primeira falha. */
async function enviarPendentes(): Promise<Desfecho> {
  const lista = await ler();
  for (let i = 0; i < lista.length; i += TAMANHO_LOTE) {
    const lote = lista.slice(i, i + TAMANHO_LOTE);
    const r = await enviarLote(lote);
    if (r === 'sem-lote') {
      // Servidor sem suporte a lote: manda este lote um por um.
      const enviados = new Set<string>();
      for (const item of lote) {
        const u = await enviarUm(item);
        if (u !== true) {
          await remover(enviados);
          return { restantes: await pendentes(), falha: u };
        }
        enviados.add(item.clientId);
      }
      await remover(enviados);
    } else if (r instanceof Set) {
      await remover(r);
      // Resposta sem confirmar algum item (não deveria acontecer): tenta de novo mais tarde.
      if (r.size < lote.length) return { restantes: await pendentes(), falha: { falhou: true } };
    } else {
      return { restantes: await pendentes(), falha: r };
    }
  }
  return { restantes: await pendentes() };
}

// ---------------------------------------------------------------------------------------------
// Agendamento

let emAndamento: Promise<Desfecho> | null = null;
let ativo = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let falhasSeguidas = 0;
/** Até quando o servidor pediu para esperar (429 com Retry-After). */
let bloqueadoAte = 0;

/** ±20% para totens que perderam a rede juntos não voltarem todos no mesmo instante. */
function comVariacao(ms: number) {
  return Math.round(ms * (0.8 + Math.random() * 0.4));
}

function agendar(ms: number) {
  if (!ativo) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    executar().catch(() => undefined);
  }, ms);
}

function reprogramar(d: Desfecho) {
  if (!d.falha) {
    falhasSeguidas = 0;
    // Sobrou algo sem falha = chegou avaliação nova durante o envio: manda já.
    agendar(d.restantes > 0 ? 500 : comVariacao(INTERVALO_BASE_MS));
    return;
  }
  falhasSeguidas++;
  const backoff = Math.min(INTERVALO_MAXIMO_MS, INTERVALO_BASE_MS * 2 ** (falhasSeguidas - 1));
  const pedido = d.falha.esperarMs ?? 0;
  if (pedido) bloqueadoAte = Date.now() + pedido;
  agendar(Math.max(pedido, comVariacao(backoff)));
}

/** Roda um ciclo de envio (ou aproveita o que já está em andamento) e agenda o próximo. */
function executar(forcar = false): Promise<Desfecho> {
  if (emAndamento) return emAndamento;
  const espera = bloqueadoAte - Date.now();
  if (!forcar && espera > 0) {
    agendar(espera);
    return pendentes().then((restantes) => ({ restantes }));
  }
  emAndamento = (async () => {
    try {
      const d = await enviarPendentes();
      reprogramar(d);
      return d;
    } catch {
      const d: Desfecho = { restantes: await pendentes(), falha: { falhou: true } };
      reprogramar(d);
      return d;
    } finally {
      emAndamento = null;
    }
  })();
  return emAndamento;
}

/** Envio manual (tela Admin): ignora o backoff. Retorna quantas avaliações ainda restam. */
export async function sincronizar(): Promise<number> {
  return (await executar(true)).restantes;
}

/** Liga o envio automático da fila. Retorna a função que desliga. */
export function iniciarSincronizacao(): () => void {
  ativo = true;
  executar().catch(() => undefined);

  // A API costuma estar na rede interna; não precisamos do teste de internet do NetInfo
  // (que acessa um servidor do Google). Basta saber se há conexão.
  NetInfo.configure({ reachabilityShouldRun: () => false });
  let conectado: boolean | null = null;
  const pararRede = NetInfo.addEventListener((estado) => {
    const agora = estado.isConnected === true;
    if (conectado === false && agora) {
      // A rede voltou: zera o backoff e envia logo (com uma pequena variação entre totens).
      falhasSeguidas = 0;
      agendar(1000 + Math.random() * 2000);
    }
    conectado = estado.isConnected ?? conectado;
  });

  const pararApp = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') agendar(1000);
  });

  return () => {
    ativo = false;
    if (timer) clearTimeout(timer);
    timer = null;
    pararRede();
    pararApp.remove();
  };
}

export async function testarConexao(): Promise<string> {
  const { apiUrl } = obterConfig();
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    const j = await res.json();
    return res.ok ? 'Servidor conectado ✅' : `Servidor respondeu com erro: ${j.erro ?? res.status}`;
  } catch {
    return 'Não foi possível conectar ao servidor ❌';
  }
}
