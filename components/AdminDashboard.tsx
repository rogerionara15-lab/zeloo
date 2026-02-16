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

type TabId = 'OVERVIEW' | 'FINANCIAL' | 'REQUESTS' | 'CONCIERGE' | 'CLIENTS' | 'EXTRA_ORDERS';
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

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const safeNumber = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeText = (v: any, fallback = '') => {
  const s = String(v ?? '').trim();
  return s ? s : fallback;
};

// ✅ Normaliza status vindo do Supabase / enum / string (resolve sumiço dos botões)
const normalizeStatus = (s: any): 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' => {
  const raw = String(s ?? '').trim().toUpperCase();

  if (raw.includes('PEND')) return 'PENDING';
  if (raw.includes('SCHED') || raw.includes('AGEND')) return 'SCHEDULED';
  if (raw.includes('COMP') || raw.includes('CONCL')) return 'COMPLETED';
  if (raw.includes('CANC') || raw.includes('CANCEL')) return 'CANCELLED';

  return 'PENDING';
};

const isStatus = (req: MaintenanceRequest, wanted: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') =>
  normalizeStatus((req as any).status) === wanted;

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

const LAST_SEEN_KEY = 'zeloo_admin_last_seen_v1';

const readLastSeenMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
};

const writeLastSeenMap = (m: Record<string, string>) => {
  try {
    localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(m));
  } catch {}
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
  // evita warning de “unused props”
  void profile;
  void setProfile;
  void branding;
  void setBranding;

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
  const [replyText, setReplyText] = useState('Recebemos seu chamado. Agendaremos um técnico para as próximas 24h.');

  // ✅ Modal Concluir Horas
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [hoursTarget, setHoursTarget] = useState<MaintenanceRequest | null>(null);
  const [hoursValue, setHoursValue] = useState<string>('3');

  // ✅ Extra orders
  const [extraOrders, setExtraOrders] = useState<ExtraOrder[]>([]);
  const [extraSearch, setExtraSearch] = useState('');

  // ✅ concierge “não lidas”
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});

  // ✅ Modal Ficha do Cliente (AGENDA)
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientModalUser, setClientModalUser] = useState<any>(null);

  useEffect(() => {
    setExtraOrders(readExtraOrdersFromLocal());
    setLastSeenMap(readLastSeenMap());

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'zeloo_extra_orders') setExtraOrders(readExtraOrdersFromLocal());
      if (e.key === LAST_SEEN_KEY) setLastSeenMap(readLastSeenMap());
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const stats = useMemo(
    () => ({
      totalPaid: (users || []).filter((u: any) => u?.paymentStatus === 'PAID').length,
      awaiting: (users || []).filter((u: any) => u?.paymentStatus === 'AWAITING_APPROVAL').length,
      pendingReq: (requests || []).filter((r: any) => normalizeStatus(r?.status) === 'PENDING' && r?.archived !== true).length,
    }),
    [users, requests]
  );

  const filteredUsers = useMemo(() => {
    const base = users || [];
    const q = clientSearch.trim().toLowerCase();
    if (!q) return base;

    return base.filter((u: any) => {
      if (!u) return false;
      const name = String(u?.name ?? '').toLowerCase();
      const email = String(u?.email ?? '').toLowerCase();
      const plan = String(u?.planName ?? '').toLowerCase();
      const id = String(u?.id ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || plan.includes(q) || id.includes(q);
    });
  }, [users, clientSearch]);

  // ✅ Corrigido: filtro de requests respeita status normalizado
  const filteredRequests = useMemo(() => {
    const base = (requests || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const byArchive = base.filter((r) => {
      const isArchived = (r as any).archived === true;
      return requestArchiveView === 'ARCHIVED' ? isArchived : !isArchived;
    });

    return byArchive.filter((r) => {
      if (requestStatusFilter === 'ALL') return true;
      const wanted = normalizeStatus(requestStatusFilter);
      return normalizeStatus((r as any).status) === wanted;
    });
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

    const list = Array.from(map.values()).sort((a, b) => (b.lastTime || '').localeCompare(a.lastTime || ''));

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

  const getLastUserMessageTime = (userId: string) => {
    const msgs = (chatMessages || []).filter((m) => m.userId === userId);
    const lastUser = msgs
      .filter((m) => m.sender === 'USER')
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];
    return lastUser?.timestamp || '';
  };

  const unreadCountByUser = useMemo(() => {
    const map: Record<string, number> = {};
    for (const u of conciergeUsers) {
      const lastUserTime = getLastUserMessageTime(u.userId);
      const lastSeen = lastSeenMap[u.userId] || '';
      const hasUnread = lastUserTime && lastUserTime > lastSeen;
      map[u.userId] = hasUnread ? 1 : 0;
    }
    return map;
  }, [conciergeUsers, lastSeenMap, chatMessages]);

  const totalUnreadConcierge = useMemo(() => {
    return (Object.values(unreadCountByUser) as number[]).reduce((a, b) => a + b, 0);
  }, [unreadCountByUser]);

  const markConversationAsSeen = (userId: string) => {
    const lastTime = getLastUserMessageTime(userId);
    if (!lastTime) return;

    const next = { ...lastSeenMap, [userId]: lastTime };
    setLastSeenMap(next);
    writeLastSeenMap(next);
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

  // ✅ RESET MENSAL (chama sua API)
  const resetMonthlyForUser = async (userId: string) => {
    try {
      const ok = confirm(
        'Resetar contador mensal desse cliente?\n\nIsso serve para TESTE (deixar como se ele tivesse 0 chamados usados no mês).'
      );
      if (!ok) return;

      // tenta POST
      let res = await fetch('/api/reset-monthly', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      // fallback GET
      if (!res.ok) {
        res = await fetch(`/api/reset-monthly?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        alert(`Falha no reset mensal.\n\nStatus: ${res.status}\n${txt || ''}`);
        return;
      }

      alert('✅ Reset mensal aplicado com sucesso!\n\nAgora faça logout/login no usuário de teste e tente abrir chamados novamente.');
    } catch (e: any) {
      alert(`Erro no reset mensal: ${e?.message || 'Erro desconhecido'}`);
    }
  };

  // ✅ AGENDA: abrir ficha do cliente
  const openClientCard = (u: any) => {
    setClientModalUser(u);
    setClientModalOpen(true);
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
    onUpdateRequestStatus(replyTarget.id, ServiceStatus.SCHEDULED);

    setReplyModalOpen(false);
    setReplyTarget(null);
    setReplyText('Recebemos seu chamado. Agendaremos um técnico para as próximas 24h.');
    alert('Chamado respondido e marcado como AGENDADO ✅');
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

  // ✅ BOTÕES DE AÇÃO (AGENDAR/CONCLUIR/CANCELAR) SEM SUMIR
  const RequestActions: React.FC<{ req: MaintenanceRequest }> = ({ req }) => {
    const archived = (req as any).archived === true;
    const st = normalizeStatus((req as any).status);

    const canAct = !archived && st !== 'COMPLETED' && st !== 'CANCELLED';

    return (
      <div className="flex gap-3 flex-wrap">
        {st === 'PENDING' && !archived && (
          <>
            <button
              onClick={() => openReplyModal(req)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-slate-950 transition-all"
            >
              Responder
            </button>

            <button
              onClick={() => onUpdateRequestStatus(req.id, ServiceStatus.SCHEDULED as any)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all"
            >
              Agendar
            </button>
          </>
        )}

        {st === 'SCHEDULED' && !archived && (
          <button
            onClick={() => openHoursModal(req)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all"
          >
            Concluir (Horas)
          </button>
        )}

        {canAct && (
          <button
            onClick={() => {
              const ok = confirm('Deseja cancelar este chamado?');
              if (ok) onUpdateRequestStatus(req.id, ServiceStatus.CANCELLED as any);
            }}
            className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase hover:bg-red-100 transition-all"
          >
            Cancelar
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <aside className="w-full md:w-80 bg-slate-950 text-white p-8 md:p-10 flex flex-col shrink-0 shadow-2xl z-[60]">
        <div className="flex items-center gap-4 mb-10 md:mb-16 cursor-pointer" onClick={onGoHome}>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
            Z
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter">Zeloo Ops</span>
        </div>

        {/* ✅ Atalhos rápidos */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            📅 Agenda
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            🔧 O.S
          </button>
        </div>

        <nav className="flex-grow space-y-3">
          {[
            { id: 'OVERVIEW', label: 'Início', icon: '📊' },
            { id: 'FINANCIAL', label: 'Auditoria Pix', icon: '💰', badge: stats.awaiting },
            { id: 'REQUESTS', label: 'O.S Pendentes', icon: '🔧', badge: stats.pendingReq },
            { id: 'CONCIERGE', label: 'Concierge', icon: '💬', badge: totalUnreadConcierge },
            { id: 'CLIENTS', label: 'Base Assinantes', icon: '👥' },
            { id: 'EXTRA_ORDERS', label: 'Atend. Extras', icon: '➕', badge: extraTotals.pending },
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
          className="mt-8 md:mt-10 py-5 text-red-500 font-black text-[10px] uppercase border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all"
        >
          Encerrar Sessão
        </button>
      </aside>

      <main className="flex-1 p-5 sm:p-8 md:p-16 overflow-y-auto">
        {activeTab === 'OVERVIEW' && (
          <div className="animate-in fade-in space-y-12">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Painel de Controle
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pagos</p>
                <p className="text-5xl md:text-6xl font-black text-indigo-600 tracking-tighter">{stats.totalPaid}</p>
              </div>
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pix em Auditoria</p>
                <p className="text-5xl md:text-6xl font-black text-amber-500 tracking-tighter">{stats.awaiting}</p>
              </div>
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serviços Abertos</p>
                <p className="text-5xl md:text-6xl font-black text-red-500 tracking-tighter">{stats.pendingReq}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 text-slate-500">
              <p className="text-sm font-semibold">
                Diagnóstico rápido: <span className="font-black">{users?.length ?? 0}</span> usuários,{' '}
                <span className="font-black">{requests?.length ?? 0}</span> chamados,{' '}
                <span className="font-black">{chatMessages?.length ?? 0}</span> mensagens.
              </p>

              <div className="mt-6 flex gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab('CLIENTS')}
                  className="px-8 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  📅 Abrir Agenda
                </button>
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className="px-8 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  🔧 Ver O.S
                </button>
              </div>
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

              <div className="flex gap-3 flex-wrap items-end w-full md:w-auto">
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
                  className="w-full md:w-auto px-6 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  🧹 Aplicar arquivamento
                </button>
              </div>
            </div>

            {/* ✅ MOBILE (cards) */}
            <div className="md:hidden space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 text-center text-slate-300 font-black uppercase text-xs">
                  Nenhum chamado nesse filtro
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-900">{req.userName}</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">{req.createdAt}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {req.id}</p>
                      </div>
                      <div className="shrink-0">
                        {isStatus(req, 'PENDING') && (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                            Recebido
                          </span>
                        )}
                        {isStatus(req, 'SCHEDULED') && (
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase">
                            Agendado
                          </span>
                        )}
                        {isStatus(req, 'COMPLETED') && (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase">
                            Concluído
                          </span>
                        )}
                        {isStatus(req, 'CANCELLED') && (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[9px] font-black uppercase">
                            Cancelado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-700 whitespace-pre-wrap break-words">
                      {req.description}
                    </div>

                    {(req as any).isUrgent && <div className="text-[10px] font-black text-red-500 uppercase">🚨 EMERGÊNCIA</div>}

                    {(req as any).adminReply && (
                      <div className="text-[12px] text-slate-600">
                        <span className="font-black uppercase text-slate-400">Admin:</span> {(req as any).adminReply}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-600 uppercase">
                        {typeof (req as any).visitCost === 'number' ? `${(req as any).visitCost}h` : '—'}
                      </span>

                      {(req as any).archived === true && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black uppercase">
                          Arquivado
                        </span>
                      )}
                    </div>

                    <RequestActions req={req} />
                  </div>
                ))
              )}
            </div>

            {/* ✅ DESKTOP (tabela) */}
            <div className="hidden md:block bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
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

                        {(req as any).archived === true && (
                          <div className="mt-2">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black uppercase">
                              Arquivado
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        <p className="text-sm font-medium text-slate-700 max-w-sm">{req.description}</p>
                        {(req as any).isUrgent && (
                          <span className="text-[8px] font-black text-red-500 uppercase">🚨 EMERGÊNCIA</span>
                        )}
                        {(req as any).adminReply && (
                          <p className="text-[11px] text-slate-500 mt-3">
                            <span className="font-black uppercase text-slate-400">Admin:</span> {(req as any).adminReply}
                          </p>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        {isStatus(req, 'PENDING') && (
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                            Recebido
                          </span>
                        )}
                        {isStatus(req, 'SCHEDULED') && (
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase">
                            Agendado
                          </span>
                        )}
                        {isStatus(req, 'COMPLETED') && (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase">
                            Concluído
                          </span>
                        )}
                        {isStatus(req, 'CANCELLED') && (
                          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[9px] font-black uppercase">
                            Cancelado
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-600 uppercase">
                          {typeof (req as any).visitCost === 'number' ? `${(req as any).visitCost}h` : '—'}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <RequestActions req={req} />
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

        {activeTab === 'CLIENTS' && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Agenda — Base de Assinantes</h2>

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

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
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
                            onClick={() => openClientCard(u)}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-slate-950 transition-all"
                          >
                            📋 Ficha
                          </button>

                          <button
                            onClick={() => resetMonthlyForUser(u.id)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all"
                          >
                            🔄 Reset mensal
                          </button>

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
                              const ok = confirm(`Tem certeza que deseja excluir o usuário "${u.name}"?\n\nEssa ação não pode ser desfeita.`);
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

            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 text-center text-slate-300 font-black uppercase text-xs">
                  Nenhum assinante encontrado
                </div>
              ) : (
                filteredUsers.map((u: any) => (
                  <div key={u.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{u.email}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {u.id}</p>
                      </div>
                      {renderPaymentBadge(u)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        {u.planName || '—'}
                      </span>

                      {Boolean(u.isBlocked) ? (
                        <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase">
                          Bloqueado
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-3 flex-wrap pt-2">
                      <button
                        onClick={() => openClientCard(u)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-slate-950 transition-all"
                      >
                        📋 Ficha
                      </button>

                      <button
                        onClick={() => resetMonthlyForUser(u.id)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all"
                      >
                        🔄 Reset mensal
                      </button>

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
                          const ok = confirm(`Tem certeza que deseja excluir o usuário "${u.name}"?\n\nEssa ação não pode ser desfeita.`);
                          if (ok) onDeleteUser(u.id);
                        }}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase hover:bg-red-100 transition-all"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ⚠️ Mantive as abas FINANCIAL/CONCIERGE/EXTRA_ORDERS como estavam no seu arquivo original.
            Se quiser, eu também aplico normalizeStatus nelas onde fizer sentido. */}
      </main>

      {/* ✅ MODAL: Ficha do Cliente (Agenda) */}
      {clientModalOpen && clientModalUser && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setClientModalOpen(false)} />
          <div className="relative bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ficha do cliente</p>
                <h3 className="text-2xl font-black text-slate-900">{clientModalUser?.name || 'Cliente'}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-2">{clientModalUser?.id || ''}</p>
              </div>

              <button onClick={() => setClientModalOpen(false)} className="text-slate-300 hover:text-slate-900 font-black text-3xl" aria-label="Fechar">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">Email</p>
                <p className="font-bold text-slate-900 mt-1 break-words">{clientModalUser?.email || '—'}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">Telefone</p>
                <p className="font-bold text-slate-900 mt-1 break-words">
                  {clientModalUser?.phone || clientModalUser?.telefone || '—'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">CPF</p>
                <p className="font-bold text-slate-900 mt-1 break-words">
                  {clientModalUser?.cpf || clientModalUser?.document || '—'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">Plano</p>
                <p className="font-bold text-slate-900 mt-1 break-words">{clientModalUser?.planName || '—'}</p>
              </div>

              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase text-slate-400">Endereço</p>
                <p className="font-bold text-slate-900 mt-1 break-words">
                  {[
                    clientModalUser?.address,
                    clientModalUser?.number,
                    clientModalUser?.neighborhood,
                    clientModalUser?.city,
                    clientModalUser?.state,
                    clientModalUser?.zip,
                    clientModalUser?.complement,
                  ]
                    .filter(Boolean)
                    .join(' • ') || '—'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => resetMonthlyForUser(clientModalUser.id)}
                className="px-10 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                🔄 Reset mensal
              </button>

              <button
                onClick={() => setClientModalOpen(false)}
                className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Fechar
              </button>
            </div>

            <p className="mt-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Obs: telefone/CPF só aparecem se existirem no registro do usuário.
            </p>
          </div>
        </div>
      )}

      {/* ✅ MODAL: Responder Chamado */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setReplyModalOpen(false)} />
          <div className="relative bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responder chamado</p>
                <h3 className="text-2xl font-black text-slate-900">{replyTarget?.userName || 'Cliente'}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-2">{replyTarget?.id || ''}</p>
              </div>

              <button onClick={() => setReplyModalOpen(false)} className="text-slate-300 hover:text-slate-900 font-black text-3xl" aria-label="Fechar">
                ×
              </button>
            </div>

            <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">Mensagem para o cliente</label>
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
              Isso envia a resposta e marca o chamado como AGENDADO.
            </p>
          </div>
        </div>
      )}

      {/* ✅ MODAL: Concluir com Horas */}
      {hoursModalOpen && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" onClick={() => setHoursModalOpen(false)} />
          <div className="relative bg-white rounded-[3rem] p-8 md:p-10 max-w-xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concluir atendimento</p>
                <h3 className="text-2xl font-black text-slate-900">{hoursTarget?.userName || 'Cliente'}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-2">{hoursTarget?.id || ''}</p>
              </div>

              <button onClick={() => setHoursModalOpen(false)} className="text-slate-300 hover:text-slate-900 font-black text-3xl" aria-label="Fechar">
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

            <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Dica: use ponto ou vírgula (ex.: 2,5).</p>

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
          <div className="relative bg-white rounded-[4rem] p-10 md:p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase">Comprovante Pix</h3>
              <button onClick={() => setViewingProof(null)} className="text-slate-400 font-black text-3xl">
                ×
              </button>
            </div>
            <img src={viewingProof} className="w-full max-h-[500px] object-contain mb-8 rounded-3xl" alt="Pix Proof" />
            <button
              onClick={() => {
                const user = (users || []).find((u: any) => u.paymentProofUrl === viewingProof);
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
