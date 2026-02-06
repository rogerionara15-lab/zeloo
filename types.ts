
export enum SubscriptionPlan {
  MONTHLY = 'MENSAL',
  QUARTERLY = 'TRIMESTRAL',
  SEMESTERAL = 'SEMESTRAL',
  ANNUAL = 'ANUAL'
}

export enum ServiceStatus {
  PENDING = 'PENDENTE',
  ANALYZED = 'ANALISADO', // Novo status: aguardando aprovação do custo de visitas
  SCHEDULED = 'AGENDADO',
  EN_ROUTE = 'EM CAMINHO',
  IN_PROGRESS = 'EM EXECUÇÃO',
  COMPLETED = 'CONCLUÍDO',
  CANCELLED = 'CANCELADO'
}

export enum UserRole {
  CLIENT = 'CLIENTE',
  ADMIN = 'ADMINISTRADOR'
}

export interface PlanDetails {
  id?: string;
  name: string;
  price: string;
  tier: string;
  period: string;
  description?: string;
  features: string[];
  highlight: boolean;
  save?: string;
    archived?: boolean; // ✅ escondido da lista, mas continua contando na quota
}

export interface UserRegistration {
  id: string;
  name: string;
  email: string;
  password?: string;
  cpf: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  autoRenewal: boolean;
  planName: string;
  date: string;
  dueDate: string;
  isBlocked: boolean;
  paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'AWAITING_APPROVAL' | 'REJECTED';
  paymentProofUrl?: string;
  lastUpdate?: string;
  extraVisitsPurchased?: number; // Visitas compradas avulsas
}

export interface MaintenanceRequest {
  id: string;
  userId: string;
  userName: string;
  description: string;
  isUrgent: boolean;
  status: ServiceStatus;
  createdAt: string;

  adminReply?: string;
  visitCost?: number; // horas consumidas (ex: 3)
  customerApproved?: boolean; // se o cliente aceitou o abatimento

  archived?: boolean; // ✅ usado pra "arquivar" chamados antigos
  completedAt?: string; // ISO timestamp quando concluído
  cancelledAt?: string; // ISO timestamp quando cancelado
}


export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  sender: 'USER' | 'ADMIN';
  timestamp: string;
}

export interface AdminProfile {
  name: string;
  document: string;
  email: string;
  phone: string;
  mercadoPagoLink: string;
  mercadoPagoAccessToken?: string;
  publicKey?: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  gatewayStatus: 'CONNECTED' | 'DISCONNECTED';
  pixKey?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  subServices?: string[];
}

export interface BrandingInfo {
  name: string;
  names: string[];
  slogan: string;
  mission: string;
  vision: string;
  values: string[];
  valueProposition: string;
  targetAudience: string[];
  differentials: string[];
  tone: string;
}

export interface MobileScreen {
  id: string;
  name: string;
  description: string;
  features: string[];
  role: UserRole;
}
