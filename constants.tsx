
import { BrandingInfo, Service, MobileScreen, UserRole } from './types';

export const BRANDING_DATA: BrandingInfo = {
  name: 'Zeloo',
  names: ['Zeloo', 'Habitat Pro', 'Fixa Home'],
  slogan: 'Sua casa em boas mãos, sempre.',
  mission: 'Proporcionar tranquilidade e segurança aos lares brasileiros através de um serviço de manutenção residencial recorrente, preventivo e de alta confiança com equipe própria e qualificada.',
  vision: 'Ser a principal referência nacional em bem-estar residencial, transformando a manutenção doméstica em uma experiência simples, previsível e digital.',
  values: ['Confiança Inabalável', 'Transparência Total', 'Zelo pelo Detalhe', 'Eficiência Pragmática'],
  valueProposition: 'Um "departamento de manutenção" para sua casa. Por uma assinatura fixa, você esquece a dor de cabeça de procurar profissionais e garante que seu lar esteja sempre funcionando perfeitamente.',
  targetAudience: [
    'Profissionais liberais com rotina intensa',
    'Idosos (segurança e apoio)',
    'Investidores de imóveis',
    'Famílias modernas'
  ],
  differentials: [
    'Equipe Zeloo Certificada',
    'Agendamento digital intuitivo',
    'Garantia total de serviço',
    'Custo fixo sem surpresas'
  ],
  tone: 'Profissional, humano e extremamente confiável.'
};

export const MOBILE_APP_VISION: MobileScreen[] = [
  {
    id: 'c1',
    name: 'Dashboard "Casa Segura"',
    description: 'Tela principal do cliente focada em status imediato.',
    features: ['Botão "Solicitar Reparo"', 'Próxima visita preventiva', 'Status de saúde da casa'],
    role: UserRole.CLIENT
  },
  {
    id: 'c2',
    name: 'Diagnóstico IA',
    description: 'Interface de chat para triagem de problemas.',
    features: ['Upload de fotos/vídeos', 'Análise preditiva de falhas', 'Agendamento automático'],
    role: UserRole.CLIENT
  },
  {
    id: 'a1',
    name: 'Torre de Controle',
    description: 'Visão geral da operação para o administrador.',
    features: ['Filtros por equipe e status', 'Mapa de atendimento em tempo real', 'Fila de chamados por prioridade', 'Relatórios de satisfação'],
    role: UserRole.ADMIN
  }
];

export const BUSINESS_MODEL = {
  strategies: [
    {
      title: "Logística Inteligente",
      description: "Agrupamento geográfico de visitas para reduzir custos e tempo.",
      icon: "📉"
    },
    {
      title: "Fidelização Premium",
      description: "Relatórios mensais de saúde predial gerados por IA.",
      icon: "💎"
    },
    {
      title: "Padronização Zeloo",
      description: "Métodos e ferramentas exclusivas para garantir a mesma qualidade sempre.",
      icon: "🚀"
    }
  ],
  policy: {
    scheduling: "Agendamento via app com 48h de antecedência. Emergências atendidas em até 4h para planos Prime.",
    scopeLimit: "A assinatura cobre a mão de obra para reparos e manutenções que possam ser concluídos em até 1 (um) dia útil de trabalho (8 horas).",
    overtime: "Caso o serviço demande mais de um dia, será apresentado um orçamento adicional de 'Horas Excedentes' com base na análise técnica local.",
    exclusions: ["Obras Estruturais", "Reformas Completas", "Pintura de Fachada", "Projetos de Arquitetura", "Custo de Peças"]
  }
};

export const SERVICES: Service[] = [
  { 
    id: '1', 
    title: 'Elétrica', 
    description: 'Reparos em tomadas, disjuntores e fiação pontual.', 
    icon: '⚡',
    subServices: [
      'Troca de Tomadas e Interruptores',
      'Instalação/Troca de Chuveiro',
      'Reparo em Quadro de Disjuntores',
      'Instalação de Luminárias e Plafons',
      'Reparo em Campainhas',
      'Instalação de Sensores de Presença'
    ]
  },
  { 
    id: '2', 
    title: 'Hidráulica', 
    description: 'Vazamentos, troca de reparos e desentupimentos leves.', 
    icon: '💧',
    subServices: [
      'Reparo de Vazamentos em Torneiras',
      'Troca de Sifões e Flexíveis',
      'Desentupimento de Ralos e Pias',
      'Reparo em Válvulas de Descarga',
      'Instalação de Purificadores de Água',
      'Vedação de Pias e Bancadas'
    ]
  },
  { 
    id: '3', 
    title: 'Caixa d\'Água', 
    description: 'Limpeza periódica e inspeção de boias/vedação.', 
    icon: '🧊',
    subServices: [
      'Limpeza de Reservatório (até 1000L)',
      'Troca de Boia Mecânica',
      'Inspeção de Filtros de Entrada',
      'Vedação de Tampas',
      'Verificação de Barrilete'
    ]
  },
  { 
    id: '4', 
    title: 'Reparos Gerais', 
    description: 'Ajustes de portas, suportes e pequenas instalações.', 
    icon: '🛠️',
    subServices: [
      'Ajuste de Portas e Dobradiças',
      'Instalação de Suportes de TV',
      'Montagem de Pequenos Móveis',
      'Troca de Fechaduras Internas',
      'Instalação de Varais de Teto/Parede',
      'Fixação de Quadros e Prateleiras'
    ]
  },
  { 
    id: '5', 
    title: 'Preventiva', 
    description: 'Check-up programado para evitar falhas futuras.', 
    icon: '🔍',
    subServices: [
      'Check-up Elétrico Geral',
      'Check-up Hidráulico Geral',
      'Inspeção de Gás',
      'Lubrificação de Esquadrias',
      'Limpeza de Calhas (Baixa Altura)'
    ]
  }
];
