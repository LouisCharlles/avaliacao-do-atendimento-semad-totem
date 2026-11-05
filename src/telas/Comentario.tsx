import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { cores, fontes, useEscala } from '../tema';
import { Botao, Cabecalho, Progresso } from '../components/Base';

const LIMITE = 500;

interface Props {
  valorInicial?: string;
  onEnviar: (comentario: string) => void;
  onVoltar: (comentario: string) => void;
  /** O teclado virtual fica fora da árvore do app: digitar precisa contar como atividade. */
  onAtividade?: () => void;
}

export default function Comentario({ valorInicial = '', onEnviar, onVoltar, onAtividade }: Props) {
  const { s } = useEscala();
  const [texto, setTexto] = useState(valorInicial);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cores.pagina }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Cabecalho />
      <View style={{ flex: 1, padding: s(40) }}>
        <Progresso etapa="comentario" />
        <Text style={{ marginTop: s(30), color: cores.azul, fontFamily: fontes.titulo, fontSize: s(22), letterSpacing: s(2) }}>
          ÚLTIMA ETAPA · OPCIONAL
        </Text>
        <Text style={{ marginTop: s(12), color: cores.tinta, fontFamily: fontes.titulo, fontSize: s(36), lineHeight: s(48) }}>
          Quer deixar um comentário, elogio ou sugestão?
        </Text>
        <Text style={{ marginTop: s(10), color: cores.tinta2, fontSize: s(22), lineHeight: s(30) }}>
          Não escreva dados pessoais (nome, CPF, matrícula). Sua avaliação continua anônima.
        </Text>

        <View
          style={{
            marginTop: s(32),
            backgroundColor: cores.superficie,
            borderRadius: s(24),
            borderWidth: s(2),
            borderColor: texto ? cores.azul : cores.linha,
            padding: s(24),
            minHeight: s(300),
          }}
        >
          <TextInput
            value={texto}
            onChangeText={(t) => {
              onAtividade?.();
              setTexto(t.slice(0, LIMITE));
            }}
            multiline
            maxLength={LIMITE}
            placeholder="Toque aqui para escrever…"
            placeholderTextColor={cores.tinta3}
            textAlignVertical="top"
            style={{ flex: 1, fontSize: s(28), lineHeight: s(38), color: cores.tinta, minHeight: s(240), outlineStyle: 'none' } as object}
            accessibilityLabel="Comentário opcional"
          />
          <Text style={{ alignSelf: 'flex-end', color: cores.tinta3, fontSize: s(18) }}>
            {texto.length}/{LIMITE}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', gap: s(16), alignItems: 'center' }}>
          <Botao titulo="‹  Voltar" variante="secundario" onPress={() => onVoltar(texto)} />
          <View style={{ flex: 1 }} />
          {!texto.trim() && <Botao titulo="Pular e enviar" variante="secundario" onPress={() => onEnviar('')} />}
          <Botao titulo="Enviar avaliação" onPress={() => onEnviar(texto)} desabilitado={!texto.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
