import { supabase } from './supabaseClient';

type PaidAccessRow = {
  email: string | null;
  status: string | null;
};

export const accessService = {
  /**
   * Retorna true se o email estiver com status APPROVED na tabela paid_access.
   * OBS: aqui só valida direito de acesso (pagamento), NÃO valida senha.
   */
  isEmailApproved: async (email: string): Promise<boolean> => {
    const clean = (email || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return false;

    const { data, error } = await supabase
      .from('paid_access')
      .select('email,status')
      .eq('email', clean)
      .order('paid_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('paid_access check error:', error);
      return false;
    }

    const row = (data?.[0] as PaidAccessRow | undefined);
    const status = (row?.status || '').trim().toUpperCase();

    return status === 'APPROVED';
  },
};
