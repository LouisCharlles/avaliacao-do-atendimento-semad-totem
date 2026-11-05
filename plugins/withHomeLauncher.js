// Plugin de configuração (Expo CNG): registra o app como "tela inicial" (launcher) do Android.
// Com isso, o botão Home volta para o app de avaliação em vez da tela do sistema — um modo
// quiosque simples que não exige "device owner". Ativado com KIOSK_LAUNCHER=true no build.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

module.exports = function withHomeLauncher(config) {
  if (process.env.KIOSK_LAUNCHER !== 'true') return config;
  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    activity.$['android:launchMode'] = 'singleTask';
    activity.$['android:stateNotNeeded'] = 'true';
    activity['intent-filter'] = activity['intent-filter'] ?? [];
    const jaTem = activity['intent-filter'].some((f) =>
      (f.category ?? []).some((c) => c.$['android:name'] === 'android.intent.category.HOME'),
    );
    if (!jaTem) {
      activity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [
          { $: { 'android:name': 'android.intent.category.HOME' } },
          { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        ],
      });
    }
    return cfg;
  });
};
