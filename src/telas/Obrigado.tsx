import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import { Botao, FaixaMarca, Rodape } from '../components/Base';

const SEGUNDOS = 8;

export default function Obrigado({ onConcluir }: { onConcluir: () => void }) {
  const { s } = useEscala();
  const [restante, setRestante] = useState(SEGUNDOS);

  useEffect(() => {
    const t = setInterval(() => setRestante((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (restante <= 0) onConcluir();
  }, [restante, onConcluir]);

  return (
    <Pressable style={{ flex: 1, backgroundColor: cores.azulEscuro }} onPress={onConcluir}>
      <FaixaMarca altura={s(8)} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(64) }}>
        <View
          style={{
            width: s(220),
            height: s(220),
            borderRadius: s(110),
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: s(4),
            borderColor: cores.amarelo,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: s(120), lineHeight: s(148) }}>🙏</Text>
        </View>
        <Text style={{ color: '#fff', fontFamily: fontes.tituloForte, fontSize: s(56), lineHeight: s(66), textAlign: 'center', marginTop: s(56) }}>
          Obrigado pela{'\n'}sua avaliação!
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: s(28), lineHeight: s(40), textAlign: 'center', marginTop: s(24) }}>
          Sua opinião ajuda a SEMAD a oferecer um atendimento cada vez melhor aos servidores.
        </Text>

        <View style={{ marginTop: s(72), alignItems: 'center', gap: s(20) }}>
          <Botao titulo="Concluir" variante="destaque" onPress={onConcluir} style={{ minWidth: s(320) }} />
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: s(22) }}>Voltando ao início em {Math.max(restante, 0)} s</Text>
          <View style={{ width: s(320), height: s(8), borderRadius: s(4), backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            <View style={{ width: `${(Math.max(restante, 0) / SEGUNDOS) * 100}%`, height: '100%', backgroundColor: cores.amarelo }} />
          </View>
        </View>
      </View>
      <Rodape />
    </Pressable>
  );
}
