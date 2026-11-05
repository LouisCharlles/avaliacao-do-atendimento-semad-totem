import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import { CONTATO, ETAPAS, type Etapa } from '../domain';

const logoBranco = require('../../assets/logos/semad-branco-horizontal.png');

/** Faixa com as cores do logotipo de São Luís. */
export function FaixaMarca({ altura = 6 }: { altura?: number }) {
  return (
    <View style={{ flexDirection: 'row', height: altura }}>
      {[cores.amarelo, cores.verdeMarca, cores.turquesa, cores.azulMarca].map((c) => (
        <View key={c} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}

export function Cabecalho({ onCancelar }: { onCancelar?: () => void }) {
  const { s } = useEscala();
  return (
    <View>
      <View style={[est.cabecalho, { paddingHorizontal: s(36), height: s(112) }]}>
        <Image source={logoBranco} style={{ height: s(48), width: s(48) * (812 / 145) }} resizeMode="contain" accessibilityLabel="Prefeitura de São Luís — SEMAD" />
        <View style={{ flex: 1 }} />
        {onCancelar && (
          <Pressable
            onPress={onCancelar}
            accessibilityRole="button"
            style={({ pressed }) => [est.cancelar, { paddingHorizontal: s(22), height: s(56), borderRadius: s(28) }, pressed && { opacity: 0.7 }]}
          >
            <Text style={{ color: '#fff', fontSize: s(20), fontFamily: fontes.semi }}>✕  Cancelar</Text>
          </Pressable>
        )}
      </View>
      <FaixaMarca altura={s(6)} />
    </View>
  );
}

/** Barra de progresso segmentada (uma parte por etapa). */
export function Progresso({ etapa }: { etapa: Etapa }) {
  const { s } = useEscala();
  const i = ETAPAS.indexOf(etapa);
  return (
    <View style={{ flexDirection: 'row', gap: s(8) }} accessibilityLabel={`Etapa ${i + 1} de ${ETAPAS.length}`}>
      {ETAPAS.map((e, k) => (
        <View
          key={e}
          style={{
            flex: 1,
            height: s(10),
            borderRadius: s(5),
            backgroundColor: k < i ? cores.azul : k === i ? cores.azulEscuro : cores.linha,
          }}
        />
      ))}
    </View>
  );
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  style,
  desabilitado,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'destaque' | 'fantasma';
  style?: ViewStyle;
  desabilitado?: boolean;
}) {
  const { s } = useEscala();
  const v = {
    primario: { bg: cores.azulEscuro, fg: '#fff', borda: cores.azulEscuro },
    secundario: { bg: '#fff', fg: cores.azulEscuro, borda: cores.linha },
    destaque: { bg: cores.amarelo, fg: cores.azulEscuro, borda: cores.amarelo },
    fantasma: { bg: 'transparent', fg: '#fff', borda: 'rgba(255,255,255,0.4)' },
  }[variante];
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          height: s(88),
          borderRadius: s(44),
          paddingHorizontal: s(36),
          backgroundColor: v.bg,
          borderColor: v.borda,
          borderWidth: s(2),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: desabilitado ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Text style={{ color: v.fg, fontSize: s(26), fontFamily: fontes.titulo }}>{titulo}</Text>
    </Pressable>
  );
}

/** Rodapé com o contato da Central de Atendimento (modelo do site da SEMAD). */
export function Rodape({ claro = false }: { claro?: boolean }) {
  const { s } = useEscala();
  const cor = claro ? cores.tinta3 : 'rgba(255,255,255,0.82)';
  return (
    <View style={{ paddingHorizontal: s(40), paddingVertical: s(22), backgroundColor: claro ? 'transparent' : cores.azulEscuro }}>
      <Text style={{ color: claro ? cores.tinta2 : '#fff', fontSize: s(18), fontFamily: fontes.semi, marginBottom: s(4) }}>
        Central de Atendimento · {CONTATO.telefone}
      </Text>
      <Text style={{ color: cor, fontSize: s(15), lineHeight: s(21) }}>{CONTATO.endereco}</Text>
    </View>
  );
}

/** Animação de "respiração" para chamar o toque na tela inicial. */
export function Pulsar({ children }: { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}

const est = StyleSheet.create({
  cabecalho: { backgroundColor: cores.azulEscuro, flexDirection: 'row', alignItems: 'center' },
  cancelar: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', justifyContent: 'center' },
});
