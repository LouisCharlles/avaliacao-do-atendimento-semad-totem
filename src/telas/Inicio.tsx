import { Image, Pressable, Text, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import { FaixaMarca, Pulsar, Rodape } from '../components/Base';

const logoColorido = require('../../assets/logos/semad-colorido-vertical-fundo-escuro.png');

interface Props {
  onComecar: () => void;
  /** Toque longo (3 s) no logotipo abre a área técnica. */
  onAdmin: () => void;
}

export default function Inicio({ onComecar, onAdmin }: Props) {
  const { s } = useEscala();
  const larguraLogo = s(520);

  return (
    <Pressable style={{ flex: 1, backgroundColor: cores.azulEscuro }} onPress={onComecar} accessibilityLabel="Toque para começar a avaliação">
      {/* Formas decorativas nas cores da marca */}
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', width: s(620), height: s(620), borderRadius: s(310), backgroundColor: cores.turquesa, opacity: 0.14, top: -s(220), right: -s(260) }} />
        <View style={{ position: 'absolute', width: s(520), height: s(520), borderRadius: s(260), backgroundColor: cores.amarelo, opacity: 0.1, bottom: s(120), left: -s(300) }} />
        <View style={{ position: 'absolute', width: s(300), height: s(300), borderRadius: s(150), backgroundColor: cores.azulMarca, opacity: 0.16, bottom: -s(80), right: -s(60) }} />
      </View>

      <FaixaMarca altura={s(8)} />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(56) }}>
        <Pressable onLongPress={onAdmin} delayLongPress={3000} accessibilityLabel="Prefeitura de São Luís — SEMAD">
          <Image source={logoColorido} style={{ width: larguraLogo, height: larguraLogo * (224 / 597) }} resizeMode="contain" />
        </Pressable>

        <Text
          style={{
            color: '#fff',
            fontFamily: fontes.tituloForte,
            fontSize: s(58),
            lineHeight: s(68),
            textAlign: 'center',
            marginTop: s(80),
          }}
        >
          Como foi o seu{'\n'}atendimento hoje?
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: s(26), lineHeight: s(36), textAlign: 'center', marginTop: s(20) }}>
          Sua avaliação é anônima e nos ajuda a melhorar o atendimento ao servidor.
        </Text>

        <View style={{ flexDirection: 'row', gap: s(18), marginTop: s(56) }} accessible={false}>
          {['😄', '🙂', '😐', '🙁', '😠'].map((e) => (
            <View key={e} style={{ width: s(96), height: s(96), borderRadius: s(48), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: s(54), lineHeight: s(66) }}>{e}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: s(72) }}>
          <Pulsar>
            <View
              style={{
                backgroundColor: cores.amarelo,
                height: s(112),
                paddingHorizontal: s(64),
                borderRadius: s(56),
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text style={{ color: cores.azulEscuro, fontFamily: fontes.tituloForte, fontSize: s(34) }}>Toque para avaliar</Text>
            </View>
          </Pulsar>
        </View>

        <View style={{ flexDirection: 'row', gap: s(10), marginTop: s(40), flexWrap: 'nowrap', justifyContent: 'center' }}>
          {['🔒  Anônima', '⏱  Menos de 1 minuto', '✋  5 perguntas'].map((t) => (
            <View key={t} style={{ borderWidth: s(2), borderColor: 'rgba(255,255,255,0.25)', borderRadius: s(30), paddingHorizontal: s(14), paddingVertical: s(10) }}>
              <Text style={{ color: '#fff', fontSize: s(17), fontFamily: fontes.semi }} numberOfLines={1}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' }}>
        <Rodape />
      </View>
    </Pressable>
  );
}
