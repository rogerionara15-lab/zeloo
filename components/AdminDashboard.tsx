import React, { useEffect, useMemo, useState } from 'react';
import {
  AdminProfile,
  UserRegistration,
  MaintenanceRequest,
  ServiceStatus,
  BrandingInfo,
  ChatMessage,
} from '../types';

interface AdminDashboardProps {
  profile: AdminProfile;
  setProfile: (p: AdminProfile) => void;
  users: UserRegistration[];
  requests: MaintenanceRequest[];
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string, sender: 'USER' | 'ADMIN', userId: string, userName: string) => void;
  onUpdateRequestStatus: (id: string, status: ServiceStatus, visitCost?: number) => void;
  onLogout: () => void;
  onGoHome?: () => void;
  onUpdateUserStatus: (userId: string, isBlocked: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onAdminReply: (requestId: string, reply: string) => void;
  onHandlePaymentAction: (userId: string, action: 'APPROVE' | 'REJECT') => void;
  branding: BrandingInfo;
  setBranding: (b: BrandingInfo) => void;

  // ✅ limpeza de concluídos antigos (vem do App.tsx)
  onClearOldCompletedRequests: () => void;
}

type TabId =
  | 'OVERVIEW'
  | 'FINANCIAL'
  | 'REQUESTS'
  | 'CONCIERGE'
  | 'CLIENTS'
  | 'EXTRA_ORDERS'
  | 'INTEGRATION';

type ArchiveView = 'ACTIVE' | 'ARCHIVED';

/** ✅ Pedidos de atendimentos extras (registrados localmente por enquanto) */
type ExtraOrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

type ExtraOrder = {
  id: string;
  userId: string;
  userName: string;
  userPlan?: string;
  qty: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  status: ExtraOrderStatus;
};

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const safeNumber = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeText = (v: any, fallback = '') => {
  const s = String(v ?? '').trim();
  return s ? s : fallback;
};

const readExtraOrdersFromLocal = (): ExtraOrder[] => {
  try {
    const raw = localStorage.getItem('zeloo_extra_orders');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized: ExtraOrder[] = parsed
      .map((o: any) => {
        const qty = safeNumber(o?.qty ?? o?.quantity ?? 1, 1);
        const unitPrice = safeNumber(o?.unitPrice ?? o?.price ?? 0, 0);
        const total = safeNumber(o?.total, unitPrice * qty);

        const statusRaw = String(o?.status ?? 'PENDING').toUpperCase();
        const status: ExtraOrderStatus =
          statusRaw === 'PAID' || statusRaw === 'CANCELLED' ? statusRaw : 'PENDING';

        const createdAt = safeText(o?.createdAt, new Date().toLocaleString('pt-BR'));

        return {
          id: safeText(o?.id, `extra-${Date.now()}`),
          userId: safeText(o?.userId, '—'),
          userName: safeText(o?.userName, 'Usuário'),
          userPlan: safeText(o?.userPlan ?? o?.planName, ''),
          qty,
          unitPrice,
          total,
          createdAt,
          status,
        };
      })
      .filter(Boolean);

    normalized.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return normalized;
  } catch {
    return [];
  }
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClearOldCompletedRequests,
  profile,
  setProfile,
  users,
  requests,
  chatMessages,
  onSendChatMessage,
  onLogout,
  onGoHome,
  onDeleteUser,
  onHandlePaymentAction,
  branding,
  setBranding,
  onUpdateRequestStatus,
  onAdminReply,
  onUpdateUserStatus,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('OVERVIEW');
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const [clientSearch, setClientSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');
  const [requestArchiveView, setRequestArchiveView] = useState<ArchiveView>('ACTIVE');

  // ✅ Concierge
  const [conciergeSearch, setConciergeSearch] = useState('');
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [adminChatInput, setAdminChatInput] = useState('');

  // ✅ Modal Responder
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<MaintenanceRequest | null>(null);
  const [replyText, setReplyText] = useState(
    'Recebemos seu chamado. Agendaremos um técnico para as próximas 24h.'
  );

  // ✅ Modal Concluir Horas
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [hoursTarget, setHoursTarget] = useState<MaintenanceRequest | null>(null);
  const [hoursValue, setHoursValue] = useState<string>('3');

  // ✅ Extra orders
  const [extraOrders, setExtraOrders] = useState<ExtraOrder[]>([]);
  const [extraSearch, setExtraSearch] = useState('');

  useEffect(() => {
    setExtraOrders(readExtraOrdersFromLocal());

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'zeloo_extra_orders') {
        setExtraOrders(readExtraOrdersFromLocal());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const stats = useMemo(
    () => ({
      totalPaid: users.filter((u: any) => u?.paymentStatus === 'PAID').length,
      awaiting: users.filter((u: any) => u?.paymentStatus === 'AWAITING_APPROVAL').length,
      pendingReq: requests.filter((r) => r.status === ServiceStatus.PENDING).length,
    }),
    [users, requests]
  );

  const filteredUsers = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u: any) => {
      if (!u) return false;
      const name = String(u?.name ?? '').toLowerCase();
      const email = String(u?.email ?? '').toLowerCase();
      const plan = String(u?.planName ?? '').toLowerCase();
      const id = String(u?.id ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || plan.includes(q) || id.includes(q);
    });
  }, [users, clientSearch]);

  const filteredRequests = useMemo(() => {
    const base = requests
      .slice()
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const byArchive = base.filter((r) => {
      const isArchived = r.archived === true;
      return requestArchiveView === 'ARCHIVED' ? isArchived : !isArchived;
    });

    return byArchive.filter((r) =>
      requestStatusFilter === 'ALL' ? true : r.status === requestStatusFilter
    );
  }, [requests, requestArchiveView, requestStatusFilter]);

  const conciergeUsers = useMemo(() => {
    const q = conciergeSearch.trim().toLowerCase();

    const map = new Map<
      string,
      { userId: string; userName: string; lastText: string; lastTime: string; count: number }
    >();

    for (const m of chatMessages || []) {
      if (!m?.userId) continue;
      const existing = map.get(m.userId);
      if (!existing) {
        map.set(m.userId, {
          userId: m.userId,
          userName: m.userName || 'Usuário',
          lastText: m.text || '',
          lastTime: m.timestamp || '',
          count: 1,
        });
      } else {
        map.set(m.userId, {
          ...existing,
          userName: m.userName || existing.userName,
          lastText: m.text || existing.lastText,
          lastTime: m.timestamp || existing.lastTime,
          count: existing.count + 1,
        });
      }
    }

    const list = Array.from(map.values()).sort((a, b) =>
      (b.lastTime || '').localeCompare(a.lastTime || '')
    );

    return !q
      ? list
      : list.filter((u) => {
          const name = (u.userName || '').toLowerCase();
          const id = (u.userId || '').toLowerCase();
          const last = (u.lastText || '').toLowerCase();
          return name.includes(q) || id.includes(q) || last.includes(q);
        });
  }, [chatMessages, conciergeSearch]);

  const selectedConversation = useMemo(() => {
    if (!selectedChatUserId) return [];
    return (chatMessages || []).filter((m) => m.userId === selectedChatUserId);
  }, [chatMessages, selectedChatUserId]);

  const selectedUserName = useMemo(() => {
    const found = (chatMessages || []).find((m) => m.userId === selectedChatUserId);
    return found?.userName || 'Usuário';
  }, [chatMessages, selectedChatUserId]);

  const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBranding({ ...branding, [name]: value });
  };

  const handleGatewayUpdate = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value as any });
  };

  const renderPaymentBadge = (u: any) => {
    const st = u?.paymentStatus;
    if (st === 'PAID') {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase">
          Pago
        </span>
      );
    }
    if (st === 'AWAITING_APPROVAL') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
          Auditoria
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black uppercase">
        Pendente
      </span>
    );
  };

  // ✅ Responder modal handlers
  const openReplyModal = (req: MaintenanceRequest) => {
    setReplyTarget(req);
    setReplyText('Recebemos seu chamado. Agendaremos um técnico para as próximas 24h.');
    setReplyModalOpen(true);
  };

  const submitReplyModal = () => {
    if (!replyTarget) return;

    const msg = replyText.trim();
    if (!msg) {
      alert('Digite uma resposta.');
      return;
    }

    onAdminReply(replyTarget.id, msg);

    // mantém o seu padrão
    // OBS: se ServiceStatus.ANALYZED não existir no seu enum, troque por ServiceStatus.SCHEDULED
    onUpdateRequestStatus(replyTarget.id, (ServiceStatus as any).ANALYZED ?? ServiceStatus.SCHEDULED, 1);

    setReplyModalOpen(false);
    setReplyTarget(null);
    setReplyText('Recebemos seu chamado. Agendaremos um técnico para as próximas 24h.');
    alert('Chamado respondido com sucesso!');
  };

  // ✅ Horas modal handlers
  const openHoursModal = (req: MaintenanceRequest) => {
    setHoursTarget(req);
    setHoursValue('3');
    setHoursModalOpen(true);
  };

  const submitHoursModal = () => {
    if (!hoursTarget) return;

    const raw = hoursValue.trim().replace(',', '.');
    const hours = Number(raw);

    if (!Number.isFinite(hours) || hours <= 0) {
      alert('Digite um número válido de horas. Ex.: 3');
      return;
    }

    onUpdateRequestStatus(hoursTarget.id, ServiceStatus.COMPLETED, hours);

    setHoursModalOpen(false);
    setHoursTarget(null);
    setHoursValue('3');
    alert('Status atualizado: CONCLUÍDO ✅');
  };

  const filteredExtraOrders = useMemo(() => {
    const q = extraSearch.trim().toLowerCase();
    if (!q) return extraOrders;

    return extraOrders.filter((o) => {
      const name = (o.userName || '').toLowerCase();
      const id = (o.id || '').toLowerCase();
      const uid = (o.userId || '').toLowerCase();
      const plan = (o.userPlan || '').toLowerCase();
      return name.includes(q) || id.includes(q) || uid.includes(q) || plan.includes(q);
    });
  }, [extraOrders, extraSearch]);

  const extraTotals = useMemo(() => {
    const pending = filteredExtraOrders.filter((o) => o.status === 'PENDING').length;
    const paid = filteredExtraOrders.filter((o) => o.status === 'PAID').length;
    const revenue = filteredExtraOrders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + safeNumber(o.total, 0), 0);

    return { pending, paid, revenue };
  }, [filteredExtraOrders]);

  const setExtraOrderStatus = (id: string, status: ExtraOrderStatus) => {
    const next = extraOrders.map((o) => (o.id === id ? { ...o, status } : o));
    setExtraOrders(next);
    try {
      localStorage.setItem('zeloo_extra_orders', JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <aside className="w-full md:w-80 bg-slate-950 text-white p-10 flex flex-col shrink-0 shadow-2xl z-[60]">
        <div className="flex items-center gap-4 mb-16 cursor-pointer" onClick={onGoHome}>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
            Z
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter">Zeloo Ops</span>
        </div>

        <nav className="flex-grow space-y-3">
          {[
            { id: 'OVERVIEW', label: 'Início', icon: '📊' },
            { id: 'FINANCIAL', label: 'Auditoria Pix', icon: '💰', badge: stats.awaiting },
            { id: 'REQUESTS', label: 'O.S Pendentes', icon: '🔧', badge: stats.pendingReq },
            { id: 'CONCIERGE', label: 'Concierge', icon: '💬' },
            { id: 'CLIENTS', label: 'Base Assinantes', icon: '👥' },
            { id: 'EXTRA_ORDERS', label: 'Atend. Extras', icon: '➕', badge: extraTotals.pending },
            { id: 'INTEGRATION', label: 'Integração', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`w-full text-left px-6 py-5 rounded-2xl transition-all font-bold flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-2xl'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{item.icon}</span>
                <span className="text-[11px] tracking-widest uppercase">{item.label}</span>
              </div>
              {item.badge ? (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="mt-10 py-5 text-red-500 font-black text-[10px] uppercase border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all"
        >
          Encerrar Sessão
        </button>
      </aside>

      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        {activeTab === 'OVERVIEW' && (
          <div className="animate-in fade-in space-y-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Painel de Controle</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pagos</p>
                <p className="text-6xl font-black text-indigo-600 tracking-tighter">{stats.totalPaid}</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pix em Auditoria</p>
                <p className="text-6xl font-black text-amber-500 tracking-tighter">{stats.awaiting}</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serviços Abertos</p>
                <p className="text-6xl font-black text-red-500 tracking-tighter">{stats.pendingReq}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FINANCIAL' && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Validar Pagamentos</h2>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-x-auto">
              <table className="w-full text-left min-w-[1200px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Assinante</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano / Valor</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Auditoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users
                    .filter((u: any) => u?.paymentStatus === 'AWAITING_APPROVAL')
                    .map((u: any) => (
                      <tr key={u.id}>
                        <td className="px-8 py-8">
                          <p className="font-bold text-slate-900 text-lg">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                        </td>
                        <td className="px-8 py-8">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{u.planName}</span>
                          {u.paymentProofUrl && (
                            <button
                              onClick={() => setViewingProof(u.paymentProofUrl)}
                              className="block mt-2 text-emerald-500 text-[9px] font-black uppercase underline"
                            >
                              Ver Comprovante
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex gap-3">
                            <button
                              onClick={() => onHandlePaymentAction(u.id, 'APPROVE')}
                              className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-emerald-600 transition-all"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => onHandlePaymentAction(u.id, 'REJECT')}
                              className="bg-red-50 text-red-500 px-6 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-red-100 transition-all"
                            >
                              Recusar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'REQUESTS' && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Ordens de Serviço</h2>
                <p className="text-slate-500 font-semibold text-sm mt-2">
                  Fluxo: <span className="font-black">Pendente → Agendado → Concluído</span>
                </p>
              </div>

              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setRequestArchiveView('ACTIVE')}
                    className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                      requestArchiveView === 'ACTIVE'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Ativos
                  </button>
                  <button
                    onClick={() => setRequestArchiveView('ARCHIVED')}
                    className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                      requestArchiveView === 'ARCHIVED'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Arquivados
                  </button>
                </div>

                <div className="w-full md:w-[260px]">
                  <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">
                    Filtrar por status
                  </label>
                  <select
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  >
                    <option value="ALL">Todos</option>
                    <option value={ServiceStatus.PENDING}>Pendentes</option>
                    <option value={ServiceStatus.SCHEDULED}>Agendados</option>
                    <option value={ServiceStatus.COMPLETED}>Concluídos</option>
                    <option value={ServiceStatus.CANCELLED}>Cancelados</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const ok = confirm(
                      'Deseja aplicar a verificação de arquivamento?\n\n✅ Chamados serão arquivados automaticamente quando couber.\n❌ Nada será apagado.'
                    );
                    if (ok) onClearOldCompletedRequests();
                  }}
                  className="px-6 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  🧹 Aplicar arquivamento
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Cliente</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Descrição</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Horas</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900">{req.userName}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{req.createdAt}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-2">ID: {req.id}</p>

                        {req.archived === true && (
                          <div className="mt-2">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black uppercase">
                              Arquivado
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-slate-700 max-w-sm">{req.description}</p>
                        {req.isUrgent && (
                          <span className="text-[8px] font-black text-red-500 uppercase">🚨 EMERGÊNCIA</span>
                        )}
                        {req.adminReply && (
                          <p className="text-[11px] text-slate-500 mt-3">
                            <span className="font-black uppercase text-slate-400">Admin:</span> {req.adminReply}
                          </p>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        {req.status === ServiceStatus.PENDING && (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                            Recebido
                          </span>
                        )}
                        {req.status === ServiceStatus.SCHEDULED && (
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase">
                            Agendado
                          </span>
                        )}
                        {req.status === ServiceStatus.COMPLETED && (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase">
                            Concluído
                          </span>
                        )}
                        {req.status === ServiceStatus.CANCELLED && (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[9px] font-black uppercase">
                            Cancelado
                          </span>
                        )}
                        {![ServiceStatus.PENDING, ServiceStatus.SCHEDULED, ServiceStatus.COMPLETED, ServiceStatus.CANCELLED].includes(
                          req.status
                        ) && (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black uppercase">
                            {req.status}
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-600 uppercase">
                          {typeof req.visitCost === 'number' ? `${req.visitCost}h` : '—'}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex gap-3 flex-wrap">
                          {req.status !== ServiceStatus.COMPLETED &&
                            req.status !== ServiceStatus.CANCELLED &&
                            req.archived !== true && (
                              <button
                                onClick={() => openHoursModal(req)}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all"
                              >
                                Concluir (Horas)
                              </button>
                            )}

                          {req.status === ServiceStatus.PENDING && req.archived !== true && (
                            <button
                              onClick={() => openReplyModal(req)}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-slate-950 transition-all"
                            >
                              Responder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase text-xs">
                        Nenhum chamado nesse filtro
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'CONCIERGE' && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Concierge — Chat Admin</h2>
                <p className="text-slate-500 font-semibold text-sm mt-2">Conversas por usuário (triagem e dúvidas rápidas).</p>
              </div>

              <div className="w-full md:w-[420px]">
                <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">
                  Buscar conversa (nome, id, última mensagem)
                </label>
                <input
                  value={conciergeSearch}
                  onChange={(e) => setConciergeSearch(e.target.value)}
                  placeholder="Ex.: Maria, user-..., 'vazamento'..."
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Conversas ({conciergeUsers.length})
                  </p>
                </div>

                <div className="divide-y divide-slate-50 max-h-[650px] overflow-y-auto">
                  {conciergeUsers.length === 0 ? (
                    <div className="px-8 py-16 text-center text-slate-300 font-black uppercase text-xs">
                      Nenhuma conversa ainda
                    </div>
                  ) : (
                    conciergeUsers.map((u) => {
                      const isSelected = selectedChatUserId === u.userId;
                      return (
                        <button
                          key={u.userId}
                          onClick={() => setSelectedChatUserId(u.userId)}
                          className={`w-full text-left px-8 py-6 transition-all ${
                            isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p
                                className={`font-black uppercase tracking-widest text-[10px] ${
                                  isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {u.userName}
                              </p>
                              <p
                                className={`text-[10px] font-mono mt-1 ${
                                  isSelected ? 'text-indigo-100' : 'text-slate-400'
                                }`}
                              >
                                {u.userId}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase ${
                                isSelected ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            >
                              {u.lastTime || ''}
                            </span>
                          </div>

                          <p className={`mt-3 text-sm font-semibold line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                            {u.lastText || '—'}
                          </p>

                          <p className={`mt-2 text-[9px] font-black uppercase ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {u.count} msg
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[650px]">
                <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  {selectedChatUserId ? (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conversando com</p>
                      <p className="text-xl font-black text-slate-900">{selectedUserName}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{selectedChatUserId}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-black text-slate-900">Selecione um usuário</p>
                      <p className="text-slate-500 font-semibold text-sm mt-2">
                        Clique em uma conversa à esquerda para abrir o chat.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-10 overflow-y-auto space-y-4 bg-white">
                  {!selectedChatUserId ? (
                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs">
                      Nenhuma conversa selecionada
                    </div>
                  ) : selectedConversation.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs">
                      Sem mensagens ainda
                    </div>
                  ) : (
                    selectedConversation.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed ${
                            msg.sender === 'ADMIN'
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                              : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none font-semibold'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span
                            className={`text-[8px] font-black uppercase mt-2 block ${
                              msg.sender === 'ADMIN' ? 'text-indigo-100 text-right' : 'text-slate-400'
                            }`}
                          >
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 border-t border-slate-100 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedChatUserId) return;

                      const text = adminChatInput.trim();
                      if (!text) return;

                      onSendChatMessage(text, 'ADMIN', selectedChatUserId, selectedUserName);
                      setAdminChatInput('');
                    }}
                    className="flex gap-4"
                  >
                    <input
                      value={adminChatInput}
                      onChange={(e) => setAdminChatInput(e.target.value)}
                      placeholder={selectedChatUserId ? 'Escreva a resposta do concierge…' : 'Selecione um usuário para responder'}
                      disabled={!selectedChatUserId}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-8 py-5 text-sm font-bold outline-none focus:border-indigo-600 transition-all disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!selectedChatUserId}
                      className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100"
                    >
                      ➔
                    </button>
                  </form>

                  {selectedChatUserId && (
                    <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Dica: use o chat para triagem. Atendimento técnico deve virar Chamado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CLIENTS' && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Base de Assinantes</h2>

              <div className="w-full md:w-[420px]">
                <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">
                  Buscar por nome, email, plano ou ID
                </label>
                <input
                  placeholder="Ex.: Maria, maria@email.com, Residencial, 9fd3..."
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Assinante</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pagamento</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id}>
                      <td className="px-8 py-8">
                        <p className="font-bold text-slate-900 text-lg">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-2">ID: {u.id}</p>

                        {Boolean(u.isBlocked) && (
                          <div className="mt-2">
                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase">
                              Bloqueado
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-8">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          {u.planName || '—'}
                        </span>
                      </td>

                      <td className="px-8 py-8">{renderPaymentBadge(u)}</td>

                      <td className="px-8 py-8">
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => {
                              const isBlocked = Boolean(u.isBlocked);
                              onUpdateUserStatus(u.id, !isBlocked);
                            }}
                            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase shadow-lg transition-all ${
                              Boolean(u.isBlocked)
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-amber-500 text-white hover:bg-amber-600'
                            }`}
                          >
                            {Boolean(u.isBlocked) ? 'Desbloquear' : 'Bloquear'}
                          </button>

                          <button
                            onClick={() => {
                              const ok = confirm(
                                `Tem certeza que deseja excluir o usuário "${u.name}"?\n\nEssa ação não pode ser desfeita.`
                              );
                              if (ok) onDeleteUser(u.id);
                            }}
                            className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase hover:bg-red-100 transition-all"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase text-xs">
                        Nenhum assinante encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'EXTRA_ORDERS' && (
          <div className="animate-in slide-in-from-right-10 space-y-10">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Atendimentos Extras</h2>
                <p className="text-slate-500 font-semibold text-sm mt-2">
                  Pedidos registrados localmente (por enquanto, sem gateway).
                </p>
              </div>

              <div className="w-full md:w-[420px]">
                <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">
                  Buscar por cliente, plano, userId ou pedidoId
                </label>
                <input
                  value={extraSearch}
                  onChange={(e) => setExtraSearch(e.target.value)}
                  placeholder="Ex.: Maria, Residencial, user-..., extra-..."
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendentes</p>
                <p className="text-6xl font-black text-amber-500 tracking-tighter">{extraTotals.pending}</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pagos</p>
                <p className="text-6xl font-black text-emerald-600 tracking-tighter">{extraTotals.paid}</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receita (Pagos)</p>
                <p className="text-3xl font-black text-indigo-600 tracking-tighter">{brl(extraTotals.revenue)}</p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-x-auto">
              <table className="w-full text-left min-w-[1200px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pedido</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Qtd</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {filteredExtraOrders.map((o) => {
                    const qty = safeNumber(o.qty, 1);
                    const unitPrice = safeNumber(o.unitPrice, 0);
                    const total = safeNumber(o.total, unitPrice * qty);

                    return (
                      <tr key={o.id}>
                        <td className="px-8 py-8">
                          <p className="font-black text-slate-900 text-sm">{o.id}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{o.createdAt}</p>
                        </td>

                        <td className="px-8 py-8">
                          <p className="font-bold text-slate-900">{o.userName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">{o.userId}</p>
                          {o.userPlan ? (
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">
                              {o.userPlan}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-8 py-8">
                          <p className="font-black text-slate-900">{qty}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{brl(unitPrice)} / un</p>
                        </td>

                        <td className="px-8 py-8">
                          <p className="font-black text-slate-900">{brl(total)}</p>
                        </td>

                        <td className="px-8 py-8">
                          {o.status === 'PENDING' && (
                            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                              Pendente
                            </span>
                          )}
                          {o.status === 'PAID' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase">
                              Pago
                            </span>
                          )}
                          {o.status === 'CANCELLED' && (
                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[9px] font-black uppercase">
                              Cancelado
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-8">
                          <div className="flex gap-3 flex-wrap">
                            <button
                              onClick={() => setExtraOrderStatus(o.id, 'PAID')}
                              className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all"
                            >
                              Marcar Pago
                            </button>
                            <button
                              onClick={() => setExtraOrderStatus(o.id, 'CANCELLED')}
                              className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase hover:bg-red-100 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredExtraOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-black uppercase text-xs">
                        Nenhum pedido de atendimentos extras encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Chave usada: <span className="font-mono">zeloo_extra_orders</span> (localStorage)
            </div>
          </div>
        )}

        {activeTab === 'INTEGRATION' && (
          <div className="animate-in slide-in-from-right-10 space-y-12">
            <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl space-y-10">
              <h2 className="text-2xl font-black uppercase tracking-widest text-indigo-400">
                Webhook & Gateways de Pagamento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase text-slate-500">
                    Gateway em Operação
                  </label>
                  <select
                    name="environment"
                    value={(profile as any).environment}
                    onChange={handleGatewayUpdate}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                  >
                    <option value="SANDBOX">Sandbox Mercado Pago (Testes)</option>
                    <option value="PRODUCTION">Stripe Live (Produção)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase text-slate-500">
                    URL de Webhook (Copiar para Gateway)
                  </label>
                  <div className="flex gap-4">
                    <input
                      readOnly
                      value={`https://zeloo.cloud/api/webhooks/${branding.name.toLowerCase()}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono text-indigo-300 outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://zeloo.cloud/api/webhooks/${branding.name.toLowerCase()}`
                        );
                        alert('URL Copiada!');
                      }}
                      className="px-6 bg-indigo-600 rounded-2xl text-[9px] font-black uppercase"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <label className="block text-[10px] font-black uppercase text-slate-500">
                    Chave Pública do Banco (API Key)
                  </label>
                  <input
                    name="publicKey"
                    value={(profile as any).publicKey || ''}
                    onChange={handleGatewayUpdate}
                    placeholder="APP_USR-..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${(profile as any).publicKey ? 'bg-emerald-500' : 'bg-red-500'}`}
                  ></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {(profile as any).publicKey ? 'Integração Ativa' : 'Aguardando Credenciais'}
                  </span>
                </div>
                <button
                  onClick={() => alert('Configurações salvas!')}
                  className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-xl space-y-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Identidade Visual {branding.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 ml-1">
                    Nome do Aplicativo
                  </label>
                  <input
                    name="name"
                    value={branding.name}
                    onChange={handleBrandingChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 ml-1">
                    Slogan Principal
                  </label>
                  <input
                    name="slogan"
                    value={branding.slogan}
                    onChange={handleBrandingChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ✅ MODAL: Responder Chamado */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setReplyModalOpen(false)}
          />
          <div className="relative bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responder chamado</p>
                <h3 className="text-2xl font-black text-slate-900">{replyTarget?.userName || 'Cliente'}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-2">{replyTarget?.id || ''}</p>
              </div>

              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-slate-300 hover:text-slate-900 font-black text-3xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">
              Mensagem para o cliente
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-bold h-48 outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all"
              placeholder="Digite a resposta do admin…"
            />

            <div className="mt-8 flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => setReplyModalOpen(false)}
                className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>

              <button
                onClick={submitReplyModal}
                className="px-10 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                Enviar resposta
              </button>
            </div>

            <p className="mt-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Isso envia a resposta e marca o chamado como analisado.
            </p>
          </div>
        </div>
      )}

      {/* ✅ MODAL: Concluir com Horas */}
      {hoursModalOpen && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setHoursModalOpen(false)}
          />
          <div className="relative bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concluir atendimento</p>
                <h3 className="text-2xl font-black text-slate-900">{hoursTarget?.userName || 'Cliente'}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-2">{hoursTarget?.id || ''}</p>
              </div>

              <button
                onClick={() => setHoursModalOpen(false)}
                className="text-slate-300 hover:text-slate-900 font-black text-3xl"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">
              Horas consumidas (ex.: 3)
            </label>

            <input
              value={hoursValue}
              onChange={(e) => setHoursValue(e.target.value)}
              inputMode="decimal"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
              placeholder="3"
            />

            <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Dica: use ponto ou vírgula (ex.: 2,5).
            </p>

            <div className="mt-8 flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => setHoursModalOpen(false)}
                className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>

              <button
                onClick={submitHoursModal}
                className="px-10 py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Confirmar conclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingProof && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-0" onClick={() => setViewingProof(null)}></div>
          <div className="relative bg-white rounded-[4rem] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase">Comprovante Pix</h3>
              <button onClick={() => setViewingProof(null)} className="text-slate-400 font-black text-3xl">×</button>
            </div>
            <img
              src={viewingProof}
              className="w-full max-h-[500px] object-contain mb-8 rounded-3xl"
              alt="Pix Proof"
            />
            <button
              onClick={() => {
                const user = users.find((u: any) => u.paymentProofUrl === viewingProof);
                if (user) onHandlePaymentAction(user.id, 'APPROVE');
                setViewingProof(null);
              }}
              className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl"
            >
              Aprovar e Liberar Acesso
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
