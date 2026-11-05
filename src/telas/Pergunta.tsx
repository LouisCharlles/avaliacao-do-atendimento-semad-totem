import { ScrollView, Text, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import type { Opcao, Pergunta as TPergunta } from '../domain';
import { Botao, Cabecalho, Progresso } from '../components/Base';
import BotaoOpcao from '../components/BotaoOpcao';

interface Props {
  pergunta: TPergunta;
  valor: number | string | undefined;
  onResponder: (v: number | string) => void;
  onVoltar?: () => void;
}

/** Destaca um trecho do enunciado (ex.: o nome da CEAT na pergunta 1). */
function Enunciado({ texto, destaque }: { texto: string; destaque?: string }) {
  const { s } = useEscala();
  // Enunciados longos (pergunta 1) usam corpo menor para as 5 opções caberem sem rolagem.
  const longo = texto.length > 120;
  const estilo = { color: cores.tinta, fontFamily: fontes.titulo, fontSize: s(longo ? 31 : 36), lineHeight: s(longo ? 41 : 48) };
  if (!destaque || !texto.includes(destaque)) return <Text style={estilo}>{texto}</Text>;
  const [antes, depois] = texto.split(destaque);
  return (
    <Text style={estilo}>
      {antes}
      <Text style={{ color: cores.azul }}>{destaque}</Text>
      {depois}
    </Text>
  );
}

export default function Pergunta({ pergunta, valor, onResponder, onVoltar }: Props) {
  const { s } = useEscala();
  const opcoes = pergunta.opcoes as Opcao<number | string>[];
  const altura = opcoes.length === 4 ? 124 : 100;

  return (
    <View style={{ flex: 1, backgroundColor: cores.pagina }}>
      <Cabecalho />
      <ScrollView contentContainerStyle={{ padding: s(40), paddingBottom: s(24), flexGrow: 1 }} bounces={false}>
        <Progresso etapa={pergunta.id} />
        <Text style={{ marginTop: s(26), color: cores.azul, fontFamily: fontes.titulo, fontSize: s(22), letterSpacing: s(2) }}>
          PERGUNTA {pergunta.numero} DE 5
        </Text>
        <View style={{ marginTop: s(10), marginBottom: s(28) }}>
          <Enunciado texto={pergunta.texto} destaque={pergunta.destaque} />
        </View>

        <View style={{ gap: s(12) }} accessibilityRole="radiogroup">
          {opcoes.map((o) => (
            <BotaoOpcao
              key={String(o.valor)}
              emoji={o.emoji}
              rotulo={o.rotulo}
              cor={o.cor}
              altura={altura}
              selecionado={valor === o.valor}
              onPress={() => onResponder(o.valor)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(40), paddingBottom: s(36), paddingTop: s(8), gap: s(20) }}>
        {onVoltar ? <Botao titulo="‹  Voltar" variante="secundario" onPress={onVoltar} /> : <View />}
        <Text style={{ flex: 1, textAlign: 'right', color: cores.tinta3, fontSize: s(20) }}>Toque em uma opção</Text>
      </View>
    </View>
  );
}
