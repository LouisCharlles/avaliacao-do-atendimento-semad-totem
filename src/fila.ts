import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { obterConfig } from './configuracao';
import type { Respostas } from './domain';

/**
 * Fila offline: toda avaliação é gravada no aparelho antes do envio. Se a rede cair, ela é
 * reenviada depois. O clientId (UUID) torna o reenvio idempotente na API.
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
let sincronizando = false;

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
  sincronizar().catch(() => undefined);
}

type Resultado = 'ok' | 'descartar' | 'tentar-depois';

async function enviar(item: AvaliacaoPendente): Promise<Resultado> {
  const { apiUrl, chave } = obterConfig();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${apiUrl}/api/avaliacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Totem-Key': chave },
      body: JSON.stringify(item),
      signal: ctrl.signal,
    });
    if (res.ok) return 'ok';
    // 400 = dado inválido: reenviar não resolve, descarta para não travar a fila.
    if (res.status === 400) return 'descartar';
    return 'tentar-depois';
  } catch {
    return 'tentar-depois';
  } finally {
    clearTimeout(t);
  }
}

/** Envia o que estiver pendente. Retorna quantas ainda restam. */
export async function sincronizar(): Promise<number> {
  if (sincronizando) return pendentes();
  sincronizando = true;
  try {
    const lista = await ler();
    const enviados = new Set<string>();
    for (const item of lista) {
      const r = await enviar(item);
      if (r === 'tentar-depois') break; // sem rede/servidor: para e tenta no próximo ciclo
      enviados.add(item.clientId);
    }
    if (enviados.size) {
      // Relê para não perder itens adicionados durante o envio.
      const atual = await ler();
      await gravar(atual.filter((i) => !enviados.has(i.clientId)));
    }
    return pendentes();
  } finally {
    sincronizando = false;
  }
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
