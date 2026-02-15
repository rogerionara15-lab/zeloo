import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserRegistration, MaintenanceRequest, ServiceStatus, ChatMessage } from '../types';

interface DashboardProps {
  onLogout: () => void;
  userData?: UserRegistration | null;
  requests: MaintenanceRequest[];
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string, sender: 'USER' | 'ADMIN', userId: string, userName: string) => void;
  onAddRequest: (desc: string, urgent: boolean) => void;
  onGoHome?: () => void;
  onApproveVisitCost: (requestId: string) => void;
  onBuyExtraVisits: (userId: string, quantity: number) => void; // (mantido por compatibilidade, mas não usamos mais aqui)
  onOpenCancel: () => void;
  onOpenPayments: () => void;
}

type TabId = 'HOME' | 'HISTORY' | 'CHAT' | 'ACCOUNT';
type HistoryView = 'ACTIVE' | 'ARCHIVED';

const parsePtBrDate = (s: string): Date | null => {
  // Espera "dd/mm/aaaa"
  const parts = s?.split('/');
  if (!parts || parts.length !== 3) return null;

  const [ddStr, mmStr, yyyyStr] = parts;
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);

  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;

  return new Date(yyyy, mm - 1, dd);
};

const ADMIN_WHATSAPP = '5543996000274'; // ✅ troque se quiser outro número

const Dashboard: React.FC<DashboardProps> = ({
  onLogout,
  userData,
  requests,
  chatMessages,
  onSendChatMessage,
  onAddRequest,
  onGoHome,
  onApproveVisitCost,
  onOpenCancel,
  onOpenPayments,
}) => {
  // ✅ Segurança: se ainda não carregou usuário, não quebra tela
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-2">
          <div className="text-5xl">⏳</div>
          <p className="text-sm font-black uppercase tracking-widest text-slate-300">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<TabId>('HOME');
  const [historyView, setHistoryView] = useState<HistoryView>('ACTIVE');

  const [showModal, setShowModal] = useState(false);
  const [newReq, setNewReq] = useState({ desc: '', urgent: false });

  const [chatInput, setChatInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ===== Atendimento Extra (Modal) =====
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraQty, setExtraQty] = useState<number>(1);

  // ✅ loading do checkout de extras
  const [extraPayLoading, setExtraPayLoading] = useState(false);

  // 🔴 Badge: contador de mensagens novas do ADMIN quando não está no chat
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const lastSeenAdminCountRef = useRef<number | null>(null);

  // ✅ Auto-scroll ao fim quando está no chat
  useEffect(() => {
    if (activeTab === 'CHAT') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // ✅ Calcula badge de mensagens novas do ADMIN
  useEffect(() => {
    const adminCount = chatMessages.filter((m) => m.sender === 'ADMIN').length;

    // primeira execução: inicializa sem notificar
    if (lastSeenAdminCountRef.current === null) {
      lastSeenAdminCountRef.current = adminCount;
      return;
    }

    const last = lastSeenAdminCountRef.current;

    // se aumentou e NÃO está no chat -> soma não lidas
    if (adminCount > last && activeTab !== 'CHAT') {
      setUnreadAdminCount((prev) => prev + (adminCount - last));
    }

    lastSeenAdminCountRef.current = adminCount;
  }, [chatMessages, activeTab]);

  const openWhatsApp = (req: MaintenanceRequest, action: 'FOTOS' | 'AGENDAR') => {
    const urgencia = req.isUrgent ? 'URGENTE' : 'NORMAL';

    const mensagem =
      `Olá, equipe Zeloo!\n\n` +
      `Sou o cliente: ${userData.name}\n` +
      `Plano: ${userData.planName}\n` +
      `Chamado: ${req.id}\n` +
      `Urgência: ${urgencia}\n\n` +
      `Descrição do problema:\n${req.description}\n\n` +
      (action === 'FOTOS'
        ? 'Vou enviar agora fotos/vídeo do problema para facilitar a análise.'
        : 'Gostaria de agendar a visita técnica. Meu período preferido é:');

    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // ✅ Extras do usuário (vem do App mapeado: extra_visits_purchased -> extraVisitsPurchased)
  const extrasAvailable = useMemo(() => {
    const v = Number((userData as any)?.extraVisitsPurchased || 0);
    return Number.isFinite(v) ? v : 0;
  }, [userData]);

  const quota = useMemo(() => {
    const plan = userData?.planName || '';

    // padrão residencial: 2 atendimentos (3h cada) = 6h/mês
    let totalHours = 6;
    let totalAppointmentsPlan = 2;

    // comercial: 4 atendimentos (3h cada) = 12h/mês
    if (plan.includes('Comercial')) {
      totalHours = 12;
      totalAppointmentsPlan = 4;
    }

    // condomínio: sob contrato (por enquanto 0 aqui)
    if (plan.includes('Condomínio')) {
      totalHours = 0;
      totalAppointmentsPlan = 0;
    }

    // ✅ SOMA EXTRAS ao total de atendimentos
    const totalAppointments = totalAppointmentsPlan + extrasAvailable;

    // Só CONCLUÍDOS do mês atual contam (mantém compatível com seu formato atual)
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

    const completedThisMonth = requests.filter((r) => {
      if (r.status !== ServiceStatus.COMPLETED) return false;
      const d = parsePtBrDate(r.createdAt);
      if (!d) return false;
      return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
    });

    const usedHours = completedThisMonth.reduce((sum, r) => sum + (Number(r.visitCost) || 0), 0);

    const usedAppointments = completedThisMonth.reduce((sum, r) => {
      const h = Number(r.visitCost) || 0;
      return sum + (h > 0 ? Math.ceil(h / 3) : 0);
    }, 0);

    const remainingHours = Math.max(0, totalHours - usedHours);
    const remainingAppointments = Math.max(0, totalAppointments - usedAppointments);

    return {
      totalHours,
      usedHours,
      remainingHours,
      totalAppointmentsPlan,
      totalAppointments,
      usedAppointments,
      remainingAppointments,
      extrasAvailable,
    };
  }, [userData, requests, extrasAvailable]);

  const usagePerc = useMemo(() => {
    if (!quota.totalHours || quota.totalHours <= 0) return 0;
    return Math.min(100, Math.max(0, (quota.usedHours / quota.totalHours) * 100));
  }, [quota]);

  // ===== Preço de atendimento extra (por atendimento de até 3h) =====
  const extraPricing = useMemo(() => {
    const plan = userData?.planName || '';

    // valores sugeridos (1 atendimento extra = até 3h)
    if (plan.includes('Comercial')) return { label: 'Atendimento extra (até 3h)', price: 220 };
    if (plan.includes('Condomínio')) return { label: 'Atendimento extra (até 3h)', price: 300 };

    // Residencial (padrão)
    return { label: 'Atendimento extra (até 3h)', price: 150 };
  }, [userData]);

  const extraTotal = useMemo(() => {
    return (extraPricing.price || 0) * (extraQty || 1);
  }, [extraPricing, extraQty]);

  const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ===== Tabela de preços por plano (para exibir no modal) =====
  const extraPriceTable = useMemo(() => {
    return {
      residential: 150,
      commercial: 220,
      condominium: 300,
    };
  }, []);

  // ✅ Checkout real de extras (Mercado Pago) -> chama /api/extras
  const handleExtraCheckout = async () => {
    try {
      setExtraPayLoading(true);

      const email = (userData?.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        alert('Seu e-mail não está válido. Faça login novamente ou ajuste seu cadastro.');
        return;
      }

      const unitPrice = Number(extraPricing.price || 0);
      const quantity = Number(extraQty || 1);

      const resp = await fetch('/api/extras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          quantity,
          price: unitPrice,
          title: `Zeloo - Atendimentos extras (${quantity}x)`,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error('Extras error:', data);
        throw new Error(data?.error || 'Falha ao iniciar pagamento de extras');
      }

      const initPoint = data?.init_point;
      if (!initPoint) {
        throw new Error('init_point não retornou do servidor');
      }

      setShowExtraModal(false);
      window.location.href = initPoint;
    } catch (err: any) {
      console.error('Erro inesperado (extras):', err);
      alert(err?.message || 'Falha ao iniciar pagamento de extras.');
    } finally {
      setExtraPayLoading(false);
    }
  };

  const filteredHistoryRequests = useMemo(() => {
    const sorted = requests.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return sorted.filter((r) => {
      const isArchived = r.archived === true;
      return historyView === 'ARCHIVED' ? isArchived : !isArchived;
    });
  }, [requests, historyView]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    onSendChatMessage(text, 'USER', userData.id, userData.name);
    setChatInput('');
  };

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);

    // ✅ Se entrou no Chat: zera badge e marca como visto
    if (tab === 'CHAT') {
      setUnreadAdminCount(0);
      const adminCount = chatMessages.filter((m) => m.sender === 'ADMIN').length;
      lastSeenAdminCountRef.current = adminCount;
    }
  };

  const statusPill = (status: ServiceStatus) => {
    if (status === ServiceStatus.COMPLETED) return 'bg-emerald-100 text-emerald-700';
    if (status === ServiceStatus.CANCELLED) return 'bg-red-100 text-red-700';
    if (status === ServiceStatus.SCHEDULED) return 'bg-indigo-100 text-indigo-700';
    if (status === ServiceStatus.PENDING) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  // ✅ Gate: se não tem atendimentos, não abre chamado e manda comprar extra
  // ✅ Gate leve: NÃO bloqueia por quota (isso é decidido no backend/RPC)
const ensureCanOpenRequest = () => {
  // condomínio sob consulta: mantém bloqueio
  if ((userData.planName || '').includes('Condomínio') && quota.totalAppointmentsPlan === 0) {
    alert('Seu plano é sob consulta. Fale com o suporte para liberar seu pacote.');
    return false;
  }

  // ✅ Importante:
  // Não bloqueia no front por "remainingAppointments" porque agora
  // o backend (RPC) faz o controle real do mês e consome extras com segurança.
  return true;
};


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* SIDEBAR */}
      <aside className="w-full md:w-80 bg-slate-950 text-white p-6 md:p-10 flex flex-col shrink-0 shadow-2xl z-[60]">
        <div className="flex items-center gap-4 mb-10 md:mb-14 cursor-pointer" onClick={onGoHome}>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
            Z
          </div>
          <div>
            <div className="text-2xl font-black uppercase tracking-tighter">Zeloo</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Área do assinante</div>
          </div>
        </div>

        <div className="mb-8 p-5 rounded-3xl bg-white/5 border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Plano</p>
          <p className="text-sm font-black text-white">{userData.planName}</p>
          <div className="mt-3 text-[10px] font-bold text-slate-300">
            {quota.remainingHours.toFixed(1)}h restantes • {quota.remainingAppointments} atendimentos
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-300">Extras disponíveis: {quota.extrasAvailable}</div>
        </div>

        <nav className="flex-grow space-y-3">
          {[
            { id: 'HOME', label: 'Resumo', icon: '🏠' },
            { id: 'HISTORY', label: 'Meus Chamados', icon: '🔧' },
            { id: 'CHAT', label: 'Concierge', icon: '💬', badge: unreadAdminCount },
            { id: 'ACCOUNT', label: 'Minha Conta', icon: '👤' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as TabId)}
              className={`w-full text-left px-6 py-5 rounded-2xl transition-all font-bold flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-2xl'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] tracking-widest uppercase">{item.label}</span>
              </div>

              {item.id === 'CHAT' && item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="mt-10 py-5 text-red-400 font-black text-[10px] uppercase border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all"
        >
          Sair do App
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 sm:p-6 md:p-16 overflow-y-auto">
        {/* HOME */}
        {activeTab === 'HOME' && (
          <div className="animate-in fade-in space-y-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <h1 className="text-4xl font-black text-slate-950 tracking-tighter">Painel do Assinante</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">
                  Bem-vindo, {userData.name}
                </p>
              </div>

              <button
                onClick={() => {
                  if (!ensureCanOpenRequest()) return;
                  setShowModal(true);
                }}
                className="px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
              >
                + Abrir Chamado
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 bg-white p-6 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uso do plano</p>
                    <h3 className="text-2xl font-black text-slate-950 mt-2">Horas Técnicas</h3>
                    <p className="text-sm text-slate-500 font-semibold mt-2">
                      Restam <span className="font-black">{quota.remainingHours.toFixed(1)}h</span> este mês
                    </p>
                    <p className="text-xs text-emerald-600 font-black mt-3">Extras disponíveis: {quota.extrasAvailable}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-5xl font-black text-indigo-600 tracking-tighter">{Math.round(usagePerc)}%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">consumido</p>
                  </div>
                </div>

                <div className="mt-8 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${usagePerc}%` }} />
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total mês</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">{quota.totalHours}h</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usadas</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">{quota.usedHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atendimentos</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">{quota.remainingAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ações rápidas</p>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => handleTabClick('HISTORY')}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                  >
                    Ver meus chamados
                  </button>
                  <button
                    onClick={() => handleTabClick('CHAT')}
                    className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Abrir concierge
                  </button>
                  <button
                    onClick={() => handleTabClick('ACCOUNT')}
                    className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Minha conta
                  </button>

                  <button
                    onClick={() => {
                      setExtraQty(1);
                      setShowExtraModal(true);
                    }}
                    className="w-full px-6 py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                  >
                    Comprar atendimentos extras
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="animate-in fade-in space-y-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Meus Chamados</h2>
                <p className="text-slate-500 font-semibold text-sm mt-2">Você pode enviar fotos e agendar via WhatsApp.</p>
              </div>

              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setHistoryView('ACTIVE')}
                    className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                      historyView === 'ACTIVE'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Ativos
                  </button>
                  <button
                    onClick={() => setHistoryView('ARCHIVED')}
                    className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                      historyView === 'ARCHIVED'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Arquivados
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (!ensureCanOpenRequest()) return;
                    setShowModal(true);
                  }}
                  className="px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  + Novo chamado
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredHistoryRequests.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center text-slate-300 font-black uppercase tracking-widest text-xs border border-dashed border-slate-200">
                  {historyView === 'ARCHIVED' ? 'Nenhum chamado arquivado' : 'Nenhum chamado ativo'}
                </div>
              ) : (
                filteredHistoryRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between gap-6 flex-wrap"
                  >
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusPill(req.status)}`}>
                          {req.status}
                        </span>

                        {req.archived === true && (
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                            Arquivado
                          </span>
                        )}

                        {req.isUrgent && <span className="text-[10px] font-black text-red-500 uppercase">🚨 Urgente</span>}
                      </div>

                      <h4 className="font-black text-slate-900 text-lg">{req.description}</h4>

                      {req.adminReply && (
                        <div className="mt-4 p-4 bg-slate-50 border-l-4 border-indigo-600 rounded-2xl">
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Engenharia Zeloo:</p>
                          <p className="text-sm font-medium text-slate-800 italic">“{req.adminReply}”</p>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-4">
                        Registrado em {req.createdAt} • ID: <span className="font-mono">{req.id}</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={() => openWhatsApp(req, 'FOTOS')}
                        className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all"
                      >
                        📸 Enviar fotos
                      </button>

                      <button
                        onClick={() => openWhatsApp(req, 'AGENDAR')}
                        className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all"
                      >
                        📅 Agendar no WhatsApp
                      </button>

                      <button
                        onClick={() => handleTabClick('CHAT')}
                        className="px-6 py-3 bg-slate-50 text-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all"
                      >
                        💬 Concierge
                      </button>

                      {req.status === ServiceStatus.PENDING && (
                        <button
                          onClick={() => {
                            onApproveVisitCost(req.id);
                            alert('Solicitação enviada ✅');
                          }}
                          className="px-6 py-3 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                        >
                          Confirmar atendimento
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CHAT */}
        {activeTab === 'CHAT' && (
          <div className="animate-in fade-in h-[70vh] md:h-[720px] max-h-[90vh] flex flex-col bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <header className="p-4 sm:p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl">
                  💬
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase">Zeloo Concierge</h3>
                  <p className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1">● Suporte Online</p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!ensureCanOpenRequest()) return;
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
              >
                + Abrir chamado
              </button>
            </header>

            <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 bg-slate-50/30">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <span className="text-6xl mb-6">💬</span>
                  <p className="text-sm font-black uppercase tracking-widest">Inicie uma conversa com nosso suporte</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] p-4 sm:p-6 rounded-[2rem] text-sm leading-relaxed ${
                        msg.sender === 'USER'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none font-medium'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={`text-[8px] font-black uppercase mt-2 block ${
                          msg.sender === 'USER' ? 'text-indigo-200 text-right' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}

              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 md:p-6 border-t border-slate-100 bg-white flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Agende horários, confirme recebimentos ou tire dúvidas..."
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-full px-4 sm:px-8 py-3 sm:py-5 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
              />
              <button
                type="submit"
                className="shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                aria-label="Enviar mensagem"
              >
                ➔
              </button>
            </form>
          </div>
        )}

        {/* ACCOUNT */}
        {activeTab === 'ACCOUNT' && (
          <div className="animate-in fade-in max-w-3xl space-y-8">
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black uppercase text-slate-950 tracking-tight">Minha Conta</h2>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Titular</p>
                  <p className="text-xl font-black text-slate-900">{userData.name}</p>
                  <p className="text-sm text-slate-500 font-semibold mt-1">{userData.email}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plano</p>
                  <p className="text-xl font-black text-indigo-600">{userData.planName}</p>
                  <p className="text-sm text-slate-500 font-semibold mt-1">
                    Status: <span className="font-black text-emerald-600">{userData.paymentStatus}</span>
                  </p>
                </div>
              </div>

              <div className="mt-12 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uso do mês</p>
                <div className="mt-3 flex items-center justify-between flex-wrap gap-4">
                  <div className="font-black text-slate-900">
                    {quota.usedHours.toFixed(1)}h usadas de {quota.totalHours}h
                  </div>
                  <div className="text-sm font-bold text-slate-600">{quota.remainingAppointments} atendimentos restantes</div>
                </div>

                <div className="mt-2 text-xs font-black text-emerald-600">Extras disponíveis: {quota.extrasAvailable}</div>
              </div>

              {/* ✅ AQUI FOI CORRIGIDO: botões não ficam invertidos + responsivo */}
              <div className="mt-12 flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={onOpenCancel}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Solicitar cancelamento
                </button>

                <button
                  onClick={onOpenPayments}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  Ver formas de pagamento
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ATENDIMENTO EXTRA */}
      {showExtraModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
            onClick={() => (extraPayLoading ? null : setShowExtraModal(false))}
          />

          <div className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
            <div className="flex justify-between items-start gap-6 mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Atendimento extra</h3>
                <p className="text-sm text-slate-600 font-semibold mt-3 leading-relaxed">
                  Atendimento extra é um pacote adicional de suporte com duração de até{' '}
                  <span className="font-black">3 horas</span>. Ideal quando você já utilizou os atendimentos do seu plano e precisa de mais um suporte rápido.
                </p>
              </div>

              <button
                onClick={() => (extraPayLoading ? null : setShowExtraModal(false))}
                className="text-slate-300 hover:text-slate-950 font-black text-3xl"
                aria-label="Fechar"
                disabled={extraPayLoading}
              >
                ×
              </button>
            </div>

            <div className="p-6 md:p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Valor por plano (1 atendimento = até 3h)
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Residencial</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{brl(extraPriceTable.residential)}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comercial</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{brl(extraPriceTable.commercial)}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Condomínio</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{brl(extraPriceTable.condominium)}</p>
                </div>
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Seu plano atual: <span className="text-indigo-600">{userData.planName}</span>
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantidade</p>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => setExtraQty((q) => Math.max(1, q - 1))}
                    className="w-12 h-12 rounded-2xl bg-slate-950 text-white font-black text-xl hover:bg-indigo-600 transition-all disabled:opacity-40"
                    disabled={extraQty <= 1 || extraPayLoading}
                  >
                    −
                  </button>

                  <select
                    value={extraQty}
                    onChange={(e) => setExtraQty(Number(e.target.value))}
                    disabled={extraPayLoading}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-indigo-600 transition-all disabled:opacity-60"
                  >
                    {Array.from({ length: 10 }).map((_, i) => {
                      const v = i + 1;
                      return (
                        <option key={v} value={v}>
                          {v} {v === 1 ? 'atendimento' : 'atendimentos'}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={() => setExtraQty((q) => Math.min(10, q + 1))}
                    className="w-12 h-12 rounded-2xl bg-slate-950 text-white font-black text-xl hover:bg-indigo-600 transition-all disabled:opacity-40"
                    disabled={extraPayLoading}
                  >
                    +
                  </button>
                </div>

                <p className="mt-4 text-xs text-slate-500 font-semibold">
                  Cada atendimento extra cobre até <span className="font-black">3 horas</span>.
                </p>
              </div>

              <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
                <p className="text-4xl font-black text-emerald-600 tracking-tighter mt-4">{brl(extraTotal)}</p>
                <p className="mt-3 text-xs text-slate-500 font-semibold">Total calculado automaticamente pelo seu plano atual.</p>
              </div>
            </div>

            <div className="mt-10 flex gap-3 flex-wrap justify-end">
              <button
                onClick={() => setShowExtraModal(false)}
                disabled={extraPayLoading}
                className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                onClick={handleExtraCheckout}
                disabled={extraPayLoading}
                className="px-10 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-60"
              >
                {extraPayLoading ? 'Abrindo Mercado Pago...' : 'Continuar para pagamento'}
              </button>
            </div>

            <p className="mt-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Após aprovado, o crédito de extras é liberado automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: NOVO CHAMADO */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">Novo Chamado Técnico</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-950 font-black text-3xl">
                ×
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">O que precisa ser reparado?</label>
                <textarea
                  value={newReq.desc}
                  onChange={(e) => setNewReq({ ...newReq, desc: e.target.value })}
                  placeholder="Descreva o problema com o máximo de detalhes para agilizarmos o reparo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 text-sm font-bold h-48 outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => {
                    if (!ensureCanOpenRequest()) return;
                    if (!newReq.desc.trim()) return alert('Descreva o problema primeiro.');
                    onAddRequest(newReq.desc, true);
                    setShowModal(false);
                    setNewReq({ desc: '', urgent: false });
                    handleTabClick('HISTORY');
                  }}
                  className="w-full flex-1 py-5 sm:py-6 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all"
                >
                  🚨 Emergência
                </button>

                <button
                  onClick={() => {
                    if (!ensureCanOpenRequest()) return;
                    if (!newReq.desc.trim()) return alert('Descreva o problema primeiro.');
                    onAddRequest(newReq.desc, false);
                    setShowModal(false);
                    setNewReq({ desc: '', urgent: false });
                    handleTabClick('HISTORY');
                  }}
                  className="w-full flex-1 py-5 sm:py-6 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 active:scale-95 transition-all"
                >
                  🛠️ Agendar visita
                </button>
              </div>

              <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Nossa engenharia responderá via chat.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
