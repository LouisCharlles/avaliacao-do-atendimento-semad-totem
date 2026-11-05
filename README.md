# Avaliação do Atendimento — App do Totem (React Native)

SEMAD · Prefeitura de São Luís

App Android, feito com React Native e Expo SDK 58, que roda no totem em pé (retrato). Nele o servidor avalia o atendimento da **Central de Atendimento ao Servidor (CEAT)** e do setor responsável pela sua demanda, sem login.

As respostas vão para a API do projeto separado **avaliacao-semad-web** (Node/Express + dashboard).

## Fluxo

1. Tela inicial ("Toque para avaliar").
2. **Pergunta 1**: atendimento da CEAT (Excelente → Péssimo, com emojis).
3. **Setor responsável**: escolha entre os 17 setores (ASJUR … SSM).
4. **Perguntas 2 a 4**: cordialidade, clareza e tempo de resposta do setor.
5. **Pergunta 5**: resolução (Sim, totalmente / Sim, parcialmente / Não / Em andamento).
6. Comentário opcional (teclado na tela, até 500 caracteres).
7. Agradecimento, que volta sozinho ao início em 8 s.

Telas em `docs/prototipo/totem-telas.png`.

## Comportamento de quiosque

- Tela sempre ligada (`expo-keep-awake`).
- Barras de status e de navegação do Android ocultas.
- Botão "voltar" físico só volta uma etapa, nunca sai do app.
- Após 45 s sem toque aparece o aviso "Ainda está aí?". Aos 60 s a avaliação incompleta é descartada e o app volta ao início. Digitar o comentário conta como atividade.
- **Fila offline**: cada avaliação é gravada no aparelho antes de ser enviada. Sem rede, o app tenta de novo a cada 30 s. Cada avaliação tem um UUID, então o reenvio não duplica.

## Configuração

```bash
cp .env.example .env
npm install
```

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | Endereço do servidor web, ex.: `http://192.168.0.10:8080` |
| `EXPO_PUBLIC_TOTEM_KEY` | Igual ao `TOTEM_API_KEY` do servidor |
| `EXPO_PUBLIC_TOTEM_ID` | Identificação deste totem (aparece no Excel) |
| `EXPO_PUBLIC_ADMIN_PIN` | PIN da área técnica (padrão `2468`) |

Esses valores são embutidos no APK no momento do build, mas podem ser alterados depois no próprio aparelho, pela área técnica.

### Área técnica no totem

Na tela inicial, toque e segure o logotipo por **3 segundos** e digite o PIN. Ali dá para:
- alterar o endereço do servidor, o ID do totem e a chave;
- testar a conexão;
- ver quantas avaliações aguardam envio e forçar o envio.

Nada disso exige gerar um APK novo.

## Gerar o APK

**Opção A, na nuvem com EAS (não precisa de Android Studio):**

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile totem            # APK comum
npx eas-cli@latest build -p android --profile totem-launcher   # APK que também vira "tela inicial" do Android
```

**Opção B, local** (precisa de JDK 17 e Android SDK):

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK em android/app/build/outputs/apk/release/app-release.apk
```

> No build local, configure uma chave de assinatura própria em `android/app/build.gradle` antes de distribuir.

Para testar num aparelho ou emulador durante o desenvolvimento: `npx expo run:android`.

## Travar o totem sem o modo kiosk

Como o modo kiosk (Lock Task / device owner) não está disponível, use uma das opções abaixo, ou as duas juntas:

1. **Perfil `totem-launcher`**: o plugin `plugins/withHomeLauncher.js` registra o app como tela inicial. Ao instalar, escolha "Avaliação SEMAD" como app de início **padrão** ("Sempre"). O botão Home passa a voltar para a avaliação.
2. **Fixar app** (Android 5+): em *Configurações › Segurança › Fixar app*, ative "Pedir PIN para liberar". Depois abra o app e fixe-o pela tela de recentes.

Também é recomendado desativar notificações, bloqueio automático de tela e atualizações automáticas, e manter o aparelho na tomada.

## Rede

- O app usa HTTP liberado (`usesCleartextTraffic` em `app.json`) para funcionar na rede interna. Se o servidor tiver HTTPS, prefira-o e remova essa opção.
- A chave do totem fica dentro do APK. Ela evita envios casuais, mas não substitui manter a API acessível apenas pela rede interna.

## Estrutura

```
App.tsx                  fluxo (máquina de estados), inatividade, botão voltar, barras ocultas
src/domain.ts            perguntas, opções com emojis e lista dos 17 setores
src/fila.ts              fila offline e envio para a API
src/configuracao.ts      endereço do servidor, ID e chave (padrões do .env, editáveis no aparelho)
src/tema.tsx             cores da marca e escala proporcional (base 720 × 1280 dp)
src/telas/               Inicio, Pergunta, Setor, Comentario, Obrigado, Admin
plugins/withHomeLauncher.js   opção de "tela inicial" do Android (perfil totem-launcher)
```

## Pontos de atenção

- A lista de setores e perguntas em `src/domain.ts` precisa ficar igual à do projeto web (`api/src/domain.js` e `dashboard/src/lib/dominio.ts`).
- O app não usa Expo Router: é um fluxo linear de quiosque, sem URLs nem histórico de navegação.
