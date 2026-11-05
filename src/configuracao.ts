import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuração do totem. Os valores padrão vêm do build (variáveis EXPO_PUBLIC_*, ver .env.example)
 * e podem ser alterados no próprio aparelho pela tela de administração (toque longo no logotipo + PIN).
 */
export interface ConfigTotem {
  apiUrl: string;
  totemId: string;
  chave: string;
}

const CHAVE_STORAGE = '@semad/config';

export const PIN_ADMIN = process.env.EXPO_PUBLIC_ADMIN_PIN ?? '2468';

export const CONFIG_PADRAO: ConfigTotem = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.10:8080').replace(/\/$/, ''),
  totemId: process.env.EXPO_PUBLIC_TOTEM_ID ?? 'totem-01',
  chave: process.env.EXPO_PUBLIC_TOTEM_KEY ?? '',
};

let atual: ConfigTotem = CONFIG_PADRAO;

export async function carregarConfig(): Promise<ConfigTotem> {
  try {
    const salvo = await AsyncStorage.getItem(CHAVE_STORAGE);
    if (salvo) atual = { ...CONFIG_PADRAO, ...JSON.parse(salvo) };
  } catch {
    atual = CONFIG_PADRAO;
  }
  return atual;
}

export async function salvarConfig(c: ConfigTotem): Promise<void> {
  atual = { ...c, apiUrl: c.apiUrl.trim().replace(/\/$/, ''), totemId: c.totemId.trim() || 'totem-01' };
  await AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(atual));
}

export const obterConfig = () => atual;
