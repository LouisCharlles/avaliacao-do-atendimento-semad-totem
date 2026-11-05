import { Pressable, ScrollView, Text, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import { SETORES, type Sigla } from '../domain';
import { Botao, Cabecalho, Progresso } from '../components/Base';

interface Props {
  valor: Sigla | undefined;
  onEscolher: (s: Sigla) => void;
  onVoltar: () => void;
}

export default function Setor({ valor, onEscolher, onVoltar }: Props) {
  const { s } = useEscala();
  return (
    <View style={{ flex: 1, backgroundColor: cores.pagina }}>
      <Cabecalho />
      <ScrollView contentContainerStyle={{ padding: s(40), paddingBottom: s(24) }} bounces={false}>
        <Progresso etapa="setor" />
        <Text style={{ marginTop: s(26), color: cores.azul, fontFamily: fontes.titulo, fontSize: s(22), letterSpacing: s(2) }}>
          SETOR RESPONSÁVEL
        </Text>
        <Text style={{ marginTop: s(10), color: cores.tinta, fontFamily: fontes.titulo, fontSize: s(33), lineHeight: s(42) }}>
          Qual setor foi responsável pela sua demanda?
        </Text>
        <Text style={{ marginTop: s(8), marginBottom: s(22), color: cores.tinta2, fontSize: s(21), lineHeight: s(28) }}>
          As próximas perguntas são sobre o atendimento desse setor.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(12) }} accessibilityRole="radiogroup">
          {SETORES.map((st) => {
            const sel = valor === st.sigla;
            return (
              <Pressable
                key={st.sigla}
                onPress={() => onEscolher(st.sigla)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${st.sigla}, ${st.nome}`}
                style={({ pressed }) => ({
                  width: (s(640) - s(12) * 2) / 3,
                  height: s(118),
                  borderRadius: s(20),
                  borderWidth: sel ? s(4) : s(2),
                  borderColor: sel ? cores.azul : cores.linha,
                  backgroundColor: sel ? cores.azulClaro : cores.superficie,
                  paddingHorizontal: s(14),
                  paddingVertical: s(10),
                  justifyContent: 'flex-start',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  elevation: sel ? 0 : 1,
                })}
              >
                <Text style={{ color: cores.azulEscuro, fontFamily: fontes.tituloForte, fontSize: s(22) }}>{st.sigla}</Text>
                <Text style={{ color: cores.tinta2, fontSize: s(14), lineHeight: s(18), marginTop: s(2) }} numberOfLines={4}>
                  {st.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(40), paddingBottom: s(36), paddingTop: s(8) }}>
        <Botao titulo="‹  Voltar" variante="secundario" onPress={onVoltar} />
      </View>
    </View>
  );
}
