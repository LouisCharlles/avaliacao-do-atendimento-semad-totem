import { Pressable, Text, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';

interface Props {
  emoji: string;
  rotulo: string;
  cor: string;
  selecionado: boolean;
  onPress: () => void;
  altura?: number;
}

/** Opção grande, com emoji, pensada para toque em tela de totem. */
export default function BotaoOpcao({ emoji, rotulo, cor, selecionado, onPress, altura = 112 }: Props) {
  const { s } = useEscala();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={rotulo}
      style={({ pressed }) => ({
        height: s(altura),
        borderRadius: s(28),
        borderWidth: selecionado ? s(4) : s(2),
        borderColor: selecionado ? cor : cores.linha,
        backgroundColor: selecionado ? `${cor}1A` : cores.superficie,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(22),
        gap: s(24),
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: '#0b2440',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: selecionado ? 0 : 2,
      })}
    >
      <View
        style={{
          width: s(altura - 30),
          height: s(altura - 30),
          borderRadius: s(altura),
          backgroundColor: `${cor}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: s(altura * 0.48), lineHeight: s(altura * 0.62) }} accessible={false}>
          {emoji}
        </Text>
      </View>
      <Text style={{ flex: 1, fontSize: s(30), color: cores.tinta, fontFamily: fontes.semi }} numberOfLines={2}>
        {rotulo}
      </Text>
      <View
        style={{
          width: s(40),
          height: s(40),
          borderRadius: s(20),
          borderWidth: s(3),
          borderColor: selecionado ? cor : cores.linha,
          backgroundColor: selecionado ? cor : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selecionado && <Text style={{ color: '#fff', fontSize: s(22), fontWeight: '900' }}>✓</Text>}
      </View>
      <View style={{ position: 'absolute', left: 0, top: s(20), bottom: s(20), width: s(6), borderRadius: s(3), backgroundColor: cor }} />
    </Pressable>
  );
}
