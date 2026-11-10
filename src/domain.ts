// Mantenha sincronizado com api/src/domain.js e dashboard/src/lib/dominio.ts do projeto web (avaliacao-semad-web).

export interface Opcao<V extends string | number> {
  valor: V;
  rotulo: string;
  emoji: string;
  cor: string;
}

/** Cores de apoio para o público (verde → vermelho), convenção de totens de satisfação. */
const VERDE_ESCURO = '#1e8e3e';
const VERDE = '#7cb342';
const AMARELO = '#f2b705';
const LARANJA = '#f07c2a';
const VERMELHO = '#d93025';

export const ESCALA_QUALIDADE: Opcao<number>[] = [
  { valor: 5, rotulo: 'Excelente', emoji: '😄', cor: VERDE_ESCURO },
  { valor: 4, rotulo: 'Bom', emoji: '🙂', cor: VERDE },
  { valor: 3, rotulo: 'Regular', emoji: '😐', cor: AMARELO },
  { valor: 2, rotulo: 'Ruim', emoji: '🙁', cor: LARANJA },
  { valor: 1, rotulo: 'Péssimo', emoji: '😠', cor: VERMELHO },
];

export const ESCALA_SATISFACAO: Opcao<number>[] = [
  { valor: 5, rotulo: 'Muito satisfatório', emoji: '😄', cor: VERDE_ESCURO },
  { valor: 4, rotulo: 'Satisfatório', emoji: '🙂', cor: VERDE },
  { valor: 3, rotulo: 'Regular', emoji: '😐', cor: AMARELO },
  { valor: 2, rotulo: 'Insatisfatório', emoji: '🙁', cor: LARANJA },
  { valor: 1, rotulo: 'Muito insatisfatório', emoji: '😠', cor: VERMELHO },
];

export type Resolucao = 'total' | 'parcial' | 'nao' | 'andamento';

export const OPCOES_RESOLUCAO: Opcao<Resolucao>[] = [
  { valor: 'total', rotulo: 'Sim, totalmente.', emoji: '😄', cor: VERDE_ESCURO },
  { valor: 'parcial', rotulo: 'Sim, parcialmente.', emoji: '🙂', cor: VERDE },
  { valor: 'nao', rotulo: 'Não.', emoji: '🙁', cor: VERMELHO },
  { valor: 'andamento', rotulo: 'Ainda está em andamento.', emoji: '⏳', cor: '#5b8def' },
];

export type ChavePergunta = 'q1' | 'q2' | 'q3' | 'q4' | 'q5';

export interface Pergunta {
  id: ChavePergunta;
  numero: number;
  texto: string;
  destaque?: string;
  opcoes: Opcao<number>[] | Opcao<Resolucao>[];
}

export const PERGUNTAS: Pergunta[] = [
  {
    id: 'q1',
    numero: 1,
    texto:
      'Como você avalia o atendimento prestado pela Central de Atendimento ao Servidor (CEAT), considerando a cordialidade, a atenção e o correto direcionamento da sua solicitação?',
    destaque: 'Central de Atendimento ao Servidor (CEAT)',
    opcoes: ESCALA_QUALIDADE,
  },
  {
    id: 'q2',
    numero: 2,
    texto: 'O setor responsável pela sua demanda prestou atendimento de forma cordial e respeitosa?',
    opcoes: ESCALA_QUALIDADE,
  },
  {
    id: 'q3',
    numero: 3,
    texto: 'Como você avalia a clareza das informações e orientações fornecidas pelo setor responsável pela sua solicitação?',
    opcoes: ESCALA_QUALIDADE,
  },
  {
    id: 'q4',
    numero: 4,
    texto: 'Como você avalia o tempo de resposta do setor responsável pela análise da sua solicitação?',
    opcoes: ESCALA_SATISFACAO,
  },
  {
    id: 'q5',
    numero: 5,
    texto: 'Sua demanda foi solucionada ou recebeu o encaminhamento necessário pelo setor responsável?',
    opcoes: OPCOES_RESOLUCAO,
  },
];

export const SETORES = [
  { sigla: 'ASJUR', nome: 'Assessoria Jurídica' },
  { sigla: 'ASRES', nome: 'Assessoria de Relações Sindicais' },
  { sigla: 'CEAT', nome: 'Central de Atendimento' },
  { sigla: 'COAD', nome: 'Coordenação de Avaliação de Desempenho' },
  { sigla: 'COADI', nome: 'Coordenação de Administração Interna' },
  {sigla: 'SDP', nome: 'Superintendência de Desenvolvimento de Pessoas'},
  {sigla: "SMG", nome: "Superintendência de Modernização da Gestão"},
  {sigla: "SGC", nome: "Superintendência de Gestão de Contratos e Serviços"},
  {sigla: "COCQ", nome: "Coordenação de Controle de Qualidade"},
  {sigla: "CORS", nome: "Coordenação de Recrutamento e Seleção"},
  { sigla: 'COAP', nome: 'Coordenação de Análise de Processos' },
  { sigla: 'COAT', nome: 'Coordenação de Arquivo Público Técnico' },
  { sigla: 'COCS', nome: 'Coordenação de Cargos e Salários' },
  { sigla: 'CODF', nome: 'Coordenação de Registro e Documentação Funcional' },
  { sigla: 'CODFAF', nome: 'Coordenação de Arquivo Funcional' },
  { sigla: 'COEC', nome: 'Coordenação de Consignações' },
  { sigla: 'COES', nome: 'Coordenação de Encargos Sociais' },
  { sigla: 'COEST', nome: 'Coordenação de Estágio' },
  { sigla: 'COFP', nome: 'Coordenação de Folha de Pagamento' },
  { sigla: 'GAB', nome: 'Gabinete' },
  { sigla: 'CPAD', nome: 'Comissão de Processo Administrativo Disciplinar' },
  { sigla: 'SAP', nome: 'Superintendência da Área de Administração de Pessoas' },
  { sigla: 'SRD', nome: 'Superintendência da Área de Registro e Documentação' },
  { sigla: 'SSM', nome: 'Superintendência da Área de Segurança no Trabalho e Medicina Funcional' },
] as const;

export type Sigla = (typeof SETORES)[number]['sigla'];

/** Ordem das etapas do fluxo: a pergunta 1 é sobre a CEAT; depois o servidor indica o setor. */
export type Etapa = 'q1' | 'setor' | 'q2' | 'q3' | 'q4' | 'q5' | 'comentario';
export const ETAPAS: Etapa[] = ['q1', 'setor', 'q2', 'q3', 'q4', 'q5', 'comentario'];

export interface Respostas {
  q1?: number;
  setor?: Sigla;
  q2?: number;
  q3?: number;
  q4?: number;
  q5?: Resolucao;
  comentario?: string;
}

export const CONTATO = {
  telefone: '+55 (98) 9136-4561',
  endereco:
    'Complexo Trapiche Santo Ângelo (Armazém João Gualberto da Costa), Av. Senador Vitorino Freire, s/n, Centro de São Luís.',
};
