import { supabase } from './services/supabaseClient';


const TABLE_CLIENTS = 'users';        // se sua tabela tiver outro nome, troque aqui
const TABLE_EXTRAS  = 'extra_orders'; // se sua tabela tiver outro nome, troque aqui

export type SubscriptionStatus = 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'INACTIVE';
export type ExtraOrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export type ClientRow = {
  id: string;
  name: string | null;
  email: string | null;
  plan_name: string | null;

  subscription_status: SubscriptionStatus | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;

  is_blocked: boolean | null;
};
export type ExtraOrderRow = {
  id: string;
  user_id: string;
  unit_price: number;
  status: ExtraOrderStatus;
  created_at: string;
};

// =========================
// BUSCAR CLIENTES
// =========================

export async function fetchClients(): Promise<ClientRow[]> {
  const { data, error } = await supabase
    .from(TABLE_CLIENTS)
    .select(`
      id,
      name,
      email,
      plan_name,
      subscription_status,
      subscription_started_at,
      subscription_expires_at,
      is_blocked
    `)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ClientRow[];
}

// =========================
// BUSCAR EXTRAS
// =========================

export async function fetchExtras(): Promise<ExtraOrderRow[]> {
  const { data, error } = await supabase
    .from(TABLE_EXTRAS)
    .select(`
  id,
  user_id,
  unit_price,
  status,
  created_at
`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ExtraOrderRow[];
}

// =========================
// ATIVAR 30 DIAS
// =========================

export async function activate30Days(userId: string): Promise<void> {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from(TABLE_CLIENTS)
    .update({
      subscription_status: 'ACTIVE',
      subscription_started_at: startedAt.toISOString(),
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

// =========================
// BLOQUEAR ASSINATURA
// =========================

export async function blockSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_CLIENTS)
    .update({
      subscription_status: 'BLOCKED',
    })
    .eq('id', userId);

  if (error) throw error;
}

// =========================
// MARCAR EXTRA COMO PAGO
// =========================

export async function markExtraPaid(extraId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_EXTRAS)
    .update({
      status: 'PAID',
    })
    .eq('id', extraId);

  if (error) throw error;
}

// =========================
// CANCELAR EXTRA
// =========================

export async function cancelExtra(extraId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_EXTRAS)
    .update({
      status: 'CANCELLED',
    })
    .eq('id', extraId);

  if (error) throw error;
}