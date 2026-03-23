// subscriptionGate.ts
import { supabase } from './services/supabaseClient';

export type SubscriptionGateResult =
  | { ok: true; status: 'ACTIVE'; expiresAt?: string | null }
  | { ok: false; reason: 'BLOCKED' | 'EXPIRED' | 'INACTIVE' | 'NOT_FOUND' | 'ERROR'; message: string };

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  return Number.isFinite(exp) && exp < now;
}

/**
 * userId aqui deve ser o MESMO id do registro em "users"
 * (o mesmo que você usa no Admin e no resto do app).
 */
export async function checkSubscriptionGate(userId: string): Promise<SubscriptionGateResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        reason: 'ERROR',
        message: 'Erro ao validar sua assinatura. Tente novamente.',
      };
    }

    if (!data) {
      return {
        ok: false,
        reason: 'NOT_FOUND',
        message: 'Seu cadastro não foi encontrado. Fale com o suporte.',
      };
    }

    const status = (data.subscription_status || 'INACTIVE').toUpperCase();
    const expiresAt = data.subscription_expires_at as string | null;

    if (status === 'BLOCKED') {
      return {
        ok: false,
        reason: 'BLOCKED',
        message: 'Seu pagamento não caiu no sistema. Aguarde ou confira se está tudo certo com seu pagamento.',
      };
    }

    // Bloqueio por vencimento (sem precisar de CRON)
    if (isExpired(expiresAt)) {
      return {
        ok: false,
        reason: 'EXPIRED',
        message: 'Sua assinatura está vencida. Regularize o pagamento para voltar a usar a Zeloo.',
      };
    }

    // Se quiser ser mais rígido:
    if (status !== 'ACTIVE') {
      return {
        ok: false,
        reason: 'INACTIVE',
        message: 'Sua assinatura está inativa. Regularize para acessar.',
      };
    }

    return { ok: true, status: 'ACTIVE', expiresAt };
  } catch {
    return {
      ok: false,
      reason: 'ERROR',
      message: 'Erro inesperado ao validar sua assinatura.',
    };
  }
}