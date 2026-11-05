import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';

export const cores = {
  azulEscuro: '#104873',
  azul: '#1c5cab',
  azulClaro: '#e8f0fa',
  pagina: '#f3f6fa',
  superficie: '#ffffff',
  tinta: '#0f1b2a',
  tinta2: '#46546a',
  tinta3: '#7a8494',
  linha: '#dfe5ee',
  amarelo: '#f6c33b',
  verdeMarca: '#9cc24a',
  turquesa: '#2bb3a3',
  azulMarca: '#2f8fd8',
};

export const fontes = {
  titulo: 'Montserrat_700Bold',
  tituloForte: 'Montserrat_800ExtraBold',
  semi: 'Montserrat_600SemiBold',
};

/**
 * O layout é desenhado para um totem em retrato com base de 720 × 1280 dp e escala
 * proporcionalmente para qualquer tela (1080 × 1920 px, 800 × 1280 etc.).
 */
const BASE_L = 720;
const BASE_A = 1280;

interface Escala {
  s: (n: number) => number;
  largura: number;
  altura: number;
}

const Ctx = createContext<Escala>({ s: (n) => n, largura: BASE_L, altura: BASE_A });

export function ProvedorEscala({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const valor = useMemo(() => {
    const f = Math.min(width / BASE_L, height / BASE_A);
    return { s: (n: number) => Math.round(n * f), largura: width, altura: height };
  }, [width, height]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useEscala = () => useContext(Ctx);
