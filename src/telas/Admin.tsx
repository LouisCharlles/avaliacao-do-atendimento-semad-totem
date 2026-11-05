import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import { Botao, Cabecalho } from '../components/Base';
import { carregarConfig, PIN_ADMIN, salvarConfig, type ConfigTotem } from '../configuracao';
import { pendentes, sincronizar, testarConexao } from '../fila';

/** Área técnica protegida por PIN: endereço da API, identificação do totem e fila offline. */
export default function Admin({ onFechar }: { onFechar: () => void }) {
  const { s } = useEscala();
  const [pin, setPin] = useState('');
  const [liberado, setLiberado] = useState(false);
  const [erroPin, setErroPin] = useState(false);
  const [cfg, setCfg] = useState<ConfigTotem | null>(null);
  const [fila, setFila] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!liberado) return;
    carregarConfig().then(setCfg);
    pendentes().then(setFila);
  }, [liberado]);

  function digitar(d: string) {
    setErroPin(false);
    const novo = (pin + d).slice(0, 8);
    setPin(novo);
    if (novo.length === PIN_ADMIN.length) {
      if (novo === PIN_ADMIN) setLiberado(true);
      else {
        setErroPin(true);
        setPin('');
      }
    }
  }

  if (!liberado) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.pagina }}>
        <Cabecalho onCancelar={onFechar} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: s(28) }}>
          <Text style={{ fontFamily: fontes.titulo, fontSize: s(34), color: cores.tinta }}>Área técnica</Text>
          <Text style={{ fontSize: s(22), color: erroPin ? '#d93025' : cores.tinta2 }}>{erroPin ? 'PIN incorreto' : 'Digite o PIN de acesso'}</Text>
          <View style={{ flexDirection: 'row', gap: s(16) }}>
            {Array.from({ length: PIN_ADMIN.length }).map((_, i) => (
              <View key={i} style={{ width: s(22), height: s(22), borderRadius: s(11), backgroundColor: i < pin.length ? cores.azulEscuro : cores.linha }} />
            ))}
          </View>
          <View style={{ width: s(420), flexDirection: 'row', flexWrap: 'wrap', gap: s(18), justifyContent: 'center' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
              d === '' ? (
                <View key={i} style={{ width: s(120), height: s(100) }} />
              ) : (
                <Pressable
                  key={i}
                  onPress={() => (d === '⌫' ? setPin((p) => p.slice(0, -1)) : digitar(d))}
                  style={({ pressed }) => ({
                    width: s(120),
                    height: s(100),
                    borderRadius: s(24),
                    backgroundColor: pressed ? cores.azulClaro : cores.superficie,
                    borderWidth: s(2),
                    borderColor: cores.linha,
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <Text style={{ fontSize: s(38), fontFamily: fontes.titulo, color: cores.tinta }}>{d}</Text>
                </Pressable>
              ),
            )}
          </View>
        </View>
      </View>
    );
  }

  const campo = (rotulo: string, chave: keyof ConfigTotem, secreto = false) => (
    <View style={{ gap: s(8) }}>
      <Text style={{ fontSize: s(20), fontFamily: fontes.semi, color: cores.tinta2 }}>{rotulo}</Text>
      <TextInput
        value={cfg?.[chave] ?? ''}
        onChangeText={(v) => setCfg((c) => (c ? { ...c, [chave]: v } : c))}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secreto}
        style={{ height: s(72), borderRadius: s(16), borderWidth: s(2), borderColor: cores.linha, backgroundColor: '#fff', paddingHorizontal: s(20), fontSize: s(24), color: cores.tinta }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: cores.pagina }}>
      <Cabecalho onCancelar={onFechar} />
      <ScrollView contentContainerStyle={{ padding: s(40), gap: s(24) }}>
        <Text style={{ fontFamily: fontes.titulo, fontSize: s(34), color: cores.tinta }}>Configuração do totem</Text>
        {campo('Endereço do servidor (ex.: http://10.0.0.5:8080)', 'apiUrl')}
        {campo('Identificação deste totem', 'totemId')}
        {campo('Chave do totem (TOTEM_API_KEY)', 'chave', true)}

        <View style={{ backgroundColor: '#fff', borderRadius: s(20), padding: s(24), borderWidth: s(2), borderColor: cores.linha, gap: s(8) }}>
          <Text style={{ fontSize: s(22), fontFamily: fontes.semi, color: cores.tinta }}>Avaliações aguardando envio: {fila}</Text>
          {!!status && <Text style={{ fontSize: s(20), color: cores.tinta2 }}>{status}</Text>}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(16) }}>
          <Botao
            titulo="Salvar"
            onPress={async () => {
              if (cfg) await salvarConfig(cfg);
              setStatus('Configuração salva.');
            }}
          />
          <Botao
            titulo="Testar conexão"
            variante="secundario"
            onPress={async () => {
              if (cfg) await salvarConfig(cfg);
              setStatus('Testando…');
              setStatus(await testarConexao());
            }}
          />
          <Botao
            titulo="Enviar pendentes"
            variante="secundario"
            onPress={async () => {
              setStatus('Enviando…');
              const r = await sincronizar();
              setFila(r);
              setStatus(r ? `Ainda restam ${r} avaliações (sem conexão?)` : 'Todas as avaliações foram enviadas.');
            }}
          />
        </View>
        <Text style={{ fontSize: s(18), color: cores.tinta3 }}>
          Dica: para impedir que o servidor saia do app, ative “Fixar app” (Configurações › Segurança) ou defina este app como tela inicial.
        </Text>
      </ScrollView>
    </View>
  );
}
