import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchClients,
  fetchExtras,
  activate30Days,
  blockSubscription,
  markExtraPaid,
  cancelExtra,
  type ClientRow,
  type ExtraOrderRow,
} from './adminUniversalService';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export function useAdminUniversalData() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [extras, setExtras] = useState<ExtraOrderRow[]>([]);
  const [state, setState] = useState<LoadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setState('loading');
      setErrorMsg(null);

      const [c, e] = await Promise.all([fetchClients(), fetchExtras()]);
      setClients(c);
      setExtras(e);

      setState('ready');
    } catch (err: any) {
      setState('error');
      setErrorMsg(err?.message ?? 'Erro ao carregar dados');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const extrasMetrics = useMemo(() => {
    const total = extras.length;
    const paid = extras.filter((x) => x.status === 'PAID');
    const pending = extras.filter((x) => x.status === 'PENDING');
    const cancelled = extras.filter((x) => x.status === 'CANCELLED');

    const revenue = paid.reduce(
  (acc, x) => acc + (Number(x.unit_price) || 0),
  0
);

    return {
      total,
      paidCount: paid.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      revenue,
    };
  }, [extras]);

  const actions = useMemo(
    () => ({
      activate30Days: async (userId: string) => {
        await activate30Days(userId);
        await reload();
      },
      blockSubscription: async (userId: string) => {
        await blockSubscription(userId);
        await reload();
      },
      markExtraPaid: async (extraId: string) => {
        await markExtraPaid(extraId);
        await reload();
      },
      cancelExtra: async (extraId: string) => {
        await cancelExtra(extraId);
        await reload();
      },
    }),
    [reload]
  );

  return {
    clients,
    extras,
    extrasMetrics,
    state,
    errorMsg,
    reload,
    actions,
  };
}