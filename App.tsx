import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat';
import { cores, fontes, ProvedorEscala, useEscala } from './src/tema';
import { ETAPAS, PERGUNTAS, type Etapa, type Respostas, type Resolucao, type Sigla } from './src/domain';
import { carregarConfig } from './src/configuracao';
import { enfileirar, sincronizar } from './src/fila';
import { Botao } from './src/components/Base';
import Inicio from './src/telas/Inicio';
import Pergunta from './src/telas/Pergunta';
import Setor from './src/telas/Setor';
import Comentario from './src/telas/Comentario';
import Obrigado from './src/telas/Obrigado';
import Admin from './src/telas/Admin';

type Tela = 'inicio' | Etapa | 'obrigado' | 'admin';

/** Sem toques por este tempo durante a avaliação → pergunta se a pessoa ainda está ali. */
const AVISO_INATIVIDADE_MS = 45_000;
/** …e, sem resposta, descarta a avaliação incompleta e volta ao início. */
const RESET_INATIVIDADE_MS = 60_000;
const SINCRONIZAR_A_CADA_MS = 30_000;
const ATRASO_AVANCO_MS = 350;

export default function App() {
  const [fontesOk] = useFonts({ Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold });
  if (!fontesOk) return <View style={{ flex: 1, backgroundColor: cores.azulEscuro }} />;
  return (
    <ProvedorEscala>
      <Totem />
    </ProvedorEscala>
  );
}

function Totem() {
  useKeepAwake(); // a tela do totem nunca apaga
  const [tela, setTela] = useState<Tela>('inicio');
  const [respostas, setRespostas] = useState<Respostas>({});
  const [avisoInatividade, setAvisoInatividade] = useState(false);
  const ultimoToque = useRef(Date.now());
  const avancando = useRef(false);

  const reiniciar = useCallback(() => {
    setRespostas({});
    setAvisoInatividade(false);
    avancando.current = false;
    setTela('inicio');
  }, []);

  // Configuração salva no aparelho + envio periódico da fila offline.
  useEffect(() => {
    carregarConfig().then(() => sincronizar().catch(() => undefined));
    const t = setInterval(() => sincronizar().catch(() => undefined), SINCRONIZAR_A_CADA_MS);
    return () => clearInterval(t);
  }, []);

  // Inatividade: só conta durante a avaliação.
  useEffect(() => {
    if (!ETAPAS.includes(tela as Etapa)) return;
    ultimoToque.current = Date.now();
    const t = setInterval(() => {
      const ocioso = Date.now() - ultimoToque.current;
      if (ocioso >= RESET_INATIVIDADE_MS) reiniciar();
      else if (ocioso >= AVISO_INATIVIDADE_MS) setAvisoInatividade(true);
    }, 1000);
    return () => clearInterval(t);
  }, [tela, reiniciar]);

  const etapaAnterior = useCallback((): Tela => {
    const i = ETAPAS.indexOf(tela as Etapa);
    return i > 0 ? ETAPAS[i - 1] : 'inicio';
  }, [tela]);

  // Botão "voltar" físico do Android: volta uma etapa, nunca sai do app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tela === 'admin' || tela === 'obrigado') reiniciar();
      else if (tela !== 'inicio') setTela(etapaAnterior());
      return true;
    });
    return () => sub.remove();
  }, [tela, etapaAnterior, reiniciar]);

  function proxima(atual: Etapa) {
    const i = ETAPAS.indexOf(atual);
    setTela(ETAPAS[i + 1]);
  }

  /** Marca a opção, mostra a seleção por um instante e avança sozinho. */
  function responder<K extends keyof Respostas>(etapa: Etapa, chave: K, valor: Respostas[K]) {
    if (avancando.current) return;
    avancando.current = true;
    setRespostas((r) => ({ ...r, [chave]: valor }));
    setTimeout(() => {
      avancando.current = false;
      proxima(etapa);
    }, ATRASO_AVANCO_MS);
  }

  async function finalizar(comentario: string) {
    const r = { ...respostas, comentario };
    if (!r.q1 || !r.setor || !r.q2 || !r.q3 || !r.q4 || !r.q5) return reiniciar();
    await enfileirar({ q1: r.q1, setor: r.setor, q2: r.q2, q3: r.q3, q4: r.q4, q5: r.q5, comentario: r.comentario });
    setRespostas({});
    setTela('obrigado');
  }

  let conteudo: React.ReactNode;
  if (tela === 'inicio') {
    conteudo = <Inicio onComecar={() => setTela('q1')} onAdmin={() => setTela('admin')} />;
  } else if (tela === 'admin') {
    conteudo = <Admin onFechar={reiniciar} />;
  } else if (tela === 'obrigado') {
    conteudo = <Obrigado onConcluir={reiniciar} />;
  } else if (tela === 'setor') {
    conteudo = (
      <Setor
        valor={respostas.setor}
        onEscolher={(s: Sigla) => responder('setor', 'setor', s)}
        onVoltar={() => setTela(etapaAnterior())}
      />
    );
  } else if (tela === 'comentario') {
    conteudo = (
      <Comentario
        valorInicial={respostas.comentario}
        onEnviar={finalizar}
        onVoltar={(c) => {
          setRespostas((r) => ({ ...r, comentario: c }));
          setTela(etapaAnterior());
        }}
        onAtividade={() => {
          ultimoToque.current = Date.now();
        }}
      />
    );
  } else {
    const p = PERGUNTAS.find((x) => x.id === tela)!;
    conteudo = (
      <Pergunta
        key={p.id}
        pergunta={p}
        valor={respostas[p.id]}
        onResponder={(v) => responder(p.id, p.id, v as number & Resolucao)}
        onVoltar={() => setTela(etapaAnterior())}
      />
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: cores.azulEscuro }}
      onTouchStart={() => {
        ultimoToque.current = Date.now();
      }}
    >
      {/* Modo quiosque "leve": esconde barras do sistema (o gesto de deslizar as mostra temporariamente). */}
      <StatusBar hidden style="light" />
      {Platform.OS === 'android' && <NavigationBar hidden />}
      {conteudo}
      {avisoInatividade && <AvisoInatividade onContinuar={() => setAvisoInatividade(false)} onSair={reiniciar} />}
    </View>
  );
}

function AvisoInatividade({ onContinuar, onSair }: { onContinuar: () => void; onSair: () => void }) {
  const { s } = useEscala();
  return (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,28,48,0.72)', alignItems: 'center', justifyContent: 'center', padding: s(48) }}>
      <View style={{ backgroundColor: '#fff', borderRadius: s(32), padding: s(48), alignItems: 'center', gap: s(20), width: '100%' }}>
        <Text style={{ fontSize: s(88), lineHeight: s(108) }}>⏰</Text>
        <Text style={{ fontFamily: fontes.titulo, fontSize: s(38), color: cores.tinta, textAlign: 'center' }}>Ainda está aí?</Text>
        <Text style={{ fontSize: s(24), color: cores.tinta2, textAlign: 'center', lineHeight: s(34) }}>
          Por inatividade, a avaliação será cancelada em alguns segundos.
        </Text>
        <View style={{ flexDirection: 'row', gap: s(16), marginTop: s(12) }}>
          <Botao titulo="Recomeçar" variante="secundario" onPress={onSair} />
          <Botao titulo="Continuar avaliando" onPress={onContinuar} />
        </View>
      </View>
    </View>
  );
}
