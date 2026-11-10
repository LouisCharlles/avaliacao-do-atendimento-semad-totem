// Plugin de configuração (Expo CNG): assina o build de release com a keystore própria do totem.
// A pasta android/ é recriada a cada `expo prebuild`, então a assinatura é injetada aqui.
// Caminho e senhas vêm das propriedades do Gradle (ex.: ~/.gradle/gradle.properties), nunca do git:
//   SEMAD_STORE_FILE=/caminho/semad-totem.jks
//   SEMAD_KEY_ALIAS=semad-totem
//   SEMAD_STORE_PASSWORD=...
//   SEMAD_KEY_PASSWORD=...
// Sem essas propriedades, o release continua assinado com a chave de debug (padrão do Expo).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARCA = '// semad-release-signing';

const BLOCO_RELEASE = `
        release { ${MARCA}
            if (project.hasProperty('SEMAD_STORE_FILE')) {
                storeFile file(SEMAD_STORE_FILE)
                storePassword SEMAD_STORE_PASSWORD
                keyAlias SEMAD_KEY_ALIAS
                keyPassword SEMAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes(MARCA)) return cfg;

    const antes = g;
    g = g.replace(/(signingConfigs\s*\{)/, `$1${BLOCO_RELEASE}`);
    g = g.replace(
      /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('SEMAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );
    if (g === antes || !g.includes('signingConfigs.release')) {
      throw new Error('withReleaseSigning: não encontrei signingConfigs/buildTypes no app/build.gradle.');
    }
    cfg.modResults.contents = g;
    return cfg;
  });
};
