import { useAdminUniversalData } from "../useAdminUniversalData";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AdminProfile,
  UserRegistration,
  MaintenanceRequest,
  ServiceStatus,
  BrandingInfo,
  ChatMessage,
} from "../types";

interface AdminDashboardProps {
  profile: AdminProfile;
  setProfile: (p: AdminProfile) => void;
  users: UserRegistration[];
  requests: MaintenanceRequest[];
  chatMessages: ChatMessage[];
  onSendChatMessage: (
    text: string,
    sender: "USER" | "ADMIN",
    userId: string,
    userName: string,
  ) => void;
  onUpdateRequestStatus: (
    id: string,
    status: ServiceStatus,
    visitCost?: number,
  ) => void;
  onLogout: () => void;
  onGoHome?: () => void;
  onUpdateUserStatus: (userId: string, isBlocked: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onAdminReply: (requestId: string, reply: string) => void;
  onHandlePaymentAction: (userId: string, action: "APPROVE" | "REJECT") => void; // Mantido para não quebrar o App.tsx
  branding: BrandingInfo;
  setBranding: (b: BrandingInfo) => void;
  onClearOldCompletedRequests: () => void;
}

type TabId = "OVERVIEW" | "REQUESTS" | "CONCIERGE" | "CLIENTS";

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// 🎨 COMPONENTE DE BOTÃO PADRONIZADO (Clean Code)
const AdminButton: React.FC<{
  onClick?: () => void;
  variant?: "primary" | "success" | "danger" | "dark" | "outline";
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
}> = ({
  onClick,
  variant = "primary",
  children,
  className = "",
  type = "button",
}) => {
  const baseStyle =
    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    dark: "bg-slate-900 text-white hover:bg-slate-950",
    outline:
      "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClearOldCompletedRequests,
  users,
  requests,
  chatMessages,
  onSendChatMessage,
  onLogout,
  onGoHome,
  onDeleteUser,
  onUpdateRequestStatus,
  onAdminReply,
  onUpdateUserStatus,
}) => {
  const universal = useAdminUniversalData();
  const [activeTab, setActiveTab] = useState<TabId>("OVERVIEW");

  // Filtros
  const [clientSearch, setClientSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<
    ServiceStatus | "ALL"
  >("ALL");
  const [conciergeSearch, setConciergeSearch] = useState("");
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(
    null,
  );
  const [adminChatInput, setAdminChatInput] = useState("");

  // Modais
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agendaUser, setAgendaUser] = useState<any | null>(null);

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<MaintenanceRequest | null>(
    null,
  );
  const [replyText, setReplyText] = useState(
    "Recebemos seu chamado. Agendaremos um técnico.",
  );
  const [scheduleDate, setScheduleDate] = useState(""); // 📅 Nova trava de agendamento

  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [hoursTarget, setHoursTarget] = useState<MaintenanceRequest | null>(
    null,
  );
  const [hoursValue, setHoursValue] = useState<string>("3");

  // 🧠 MÉTRICAS E INTELIGÊNCIA DO DASHBOARD
  const dashboardMetrics = useMemo(() => {
    const activeUsers = (users || []).filter(
      (u) => u.paymentStatus === "PAID" && !u.isBlocked,
    );
    const revenue = activeUsers.length * 97; // Exemplo: Mensalidade base. Ajuste conforme sua regra.

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    // Assinantes vencendo em 30 dias (usando dados do Supabase)
    const expiringClients = universal.clients.filter((c) => {
      if (!c.subscription_expires_at) return false;
      const expDate = new Date(c.subscription_expires_at);
      return expDate > now && expDate <= thirtyDaysFromNow;
    }).length;

    const pendingReq = (requests || []).filter(
      (r) => r.status === ServiceStatus.PENDING,
    ).length;

    return {
      totalClients: activeUsers.length,
      revenue,
      expiringClients,
      pendingReq,
    };
  }, [users, requests, universal.clients]);

  // 🔔 NOTIFICAÇÕES (Bolinhas Vermelhas)
  const pendingRequestsCount =
    requests?.filter((r) => r.status === ServiceStatus.PENDING && !r.archived)
      .length || 0;

  const unreadConciergeCount = useMemo(() => {
    // Simplificando a lógica de unread para o exemplo.
    // Conta conversas onde a última mensagem foi do usuário.
    const lastMessages = new Map();
    (chatMessages || []).forEach((m) => lastMessages.set(m.userId, m));
    let unread = 0;
    lastMessages.forEach((msg) => {
      if (msg.sender === "USER") unread++;
    });
    return unread;
  }, [chatMessages]);

  // 📅 REGRA DE NEGÓCIO: Trava de 3 chamados por dia
  const checkDailyLimit = (dateStr: string) => {
    // Considerando que você salva a data na O.S (ou usa uma lógica de data no banco)
    // Para simplificar, vou checar quantas O.S foram atualizadas ou criadas nessa data.
    const scheduledOnDate = (requests || []).filter(
      (r) =>
        r.status === ServiceStatus.SCHEDULED &&
        (r.createdAt?.includes(dateStr) || false), // Adapte para o campo real de 'data agendada' do banco
    ).length;
    return scheduledOnDate >= 3;
  };

  // HANDLERS DOS MODAIS
  const openClientCard = (u: any) => {
    setAgendaUser(u);
    setAgendaOpen(true);
  };

  const submitReplyModal = () => {
    if (!replyTarget) return;
    if (!scheduleDate) return alert("Selecione uma data para o agendamento.");
    if (checkDailyLimit(scheduleDate))
      return alert(
        "🚨 Capacidade máxima (3 chamados) atingida para este dia. Escolha outra data.",
      );

    onAdminReply(
      replyTarget.id,
      `${replyText} (Agendado para: ${scheduleDate.split("-").reverse().join("/")})`,
    );
    onUpdateRequestStatus(replyTarget.id, ServiceStatus.SCHEDULED);
    setReplyModalOpen(false);
  };

  const submitHoursModal = () => {
    if (!hoursTarget) return;
    const hours = Number(hoursValue.replace(",", "."));
    if (!Number.isFinite(hours) || hours <= 0)
      return alert("Digite um número válido.");
    onUpdateRequestStatus(hoursTarget.id, ServiceStatus.COMPLETED, hours);
    setHoursModalOpen(false);
  };

  // Renderização da Tabela de O.S (Filtrada com Memoization)
  const filteredRequests = useMemo(() => {
    const base = (requests || []).filter((r) => r.archived !== true);
    if (requestStatusFilter === "ALL") return base;
    return base.filter((r) => r.status === requestStatusFilter);
  }, [requests, requestStatusFilter]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* 🚀 SIDEBAR MODERNA COM BADGES */}
      <aside className="w-full md:w-80 bg-slate-950 text-white p-8 md:p-10 flex flex-col shrink-0 shadow-2xl z-[60]">
        <div
          className="flex items-center gap-4 mb-10 md:mb-16 cursor-pointer"
          onClick={onGoHome}
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
            Z
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter">
            Zeloo Ops
          </span>
        </div>

        <nav className="flex-grow space-y-3">
          {[
            { id: "OVERVIEW", label: "Início", icon: "📊" },
            {
              id: "REQUESTS",
              label: "Chamados",
              icon: "🔧",
              badge: pendingRequestsCount,
            },
            {
              id: "CONCIERGE",
              label: "Concierge",
              icon: "💬",
              badge: unreadConciergeCount,
            },
            { id: "CLIENTS", label: "Base Assinantes", icon: "👥" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`relative w-full text-left px-6 py-5 rounded-2xl transition-all font-bold flex items-center justify-between ${
                activeTab === item.id
                  ? "bg-indigo-600 text-white shadow-2xl"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{item.icon}</span>
                <span className="text-[11px] tracking-widest uppercase">
                  {item.label}
                </span>
              </div>
              {/* 🔴 Bolinha Vermelha Inteligente */}
              {item.badge > 0 && (
                <span className="bg-red-500 text-white flex items-center justify-center h-5 px-2 rounded-full text-[10px] font-black animate-pulse shadow-lg border border-red-400">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={onLogout}
          className="mt-8 py-5 text-red-500 font-black text-[10px] uppercase border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all"
        >
          Encerrar Sessão
        </button>
      </aside>

      {/* 🖥️ ÁREA PRINCIPAL */}
      <main className="flex-1 p-5 sm:p-8 md:p-12 overflow-y-auto">
        {/* ================= ABA: INÍCIO (DASHBOARD PROFISSIONAL) ================= */}
        {activeTab === "OVERVIEW" && (
          <div className="animate-in fade-in space-y-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
                Visão Geral
              </h1>
              <p className="text-slate-500 font-bold mt-2">
                Acompanhamento da saúde da sua operação em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">
                  👥
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Clientes Ativos
                </p>
                <p className="text-5xl font-black text-indigo-600 tracking-tighter">
                  {dashboardMetrics.totalClients}
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">
                  💰
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Faturamento Est.
                </p>
                <p className="text-4xl mt-2 font-black text-emerald-500 tracking-tighter">
                  {brl(dashboardMetrics.revenue)}
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">
                  🔧
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  O.S Pendentes
                </p>
                <p
                  className={`text-5xl font-black tracking-tighter ${dashboardMetrics.pendingReq > 5 ? "text-red-500" : "text-amber-500"}`}
                >
                  {dashboardMetrics.pendingReq}
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">
                  ⚠️
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Vencendo em 30d
                </p>
                <p className="text-5xl font-black text-slate-800 tracking-tighter">
                  {dashboardMetrics.expiringClients}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA: CHAMADOS (O.S) ================= */}
        {activeTab === "REQUESTS" && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                Gestão de Chamados
              </h2>
              <div className="flex gap-2">
                <select
                  value={requestStatusFilter}
                  onChange={(e) =>
                    setRequestStatusFilter(e.target.value as any)
                  }
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-600"
                >
                  <option value="ALL">Todos os Ativos</option>
                  <option value={ServiceStatus.PENDING}>Pendentes</option>
                  <option value={ServiceStatus.SCHEDULED}>Agendados</option>
                  <option value={ServiceStatus.COMPLETED}>Concluídos</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">
                  Nenhum chamado neste filtro.
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`bg-white rounded-3xl border shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 transition-all ${req.isUrgent ? "border-red-300 bg-red-50/20" : "border-slate-100"}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-black text-lg text-slate-900">
                          {req.userName}
                        </h4>
                        {req.isUrgent && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase animate-pulse">
                            🚨 Urgente
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-600 whitespace-pre-wrap">
                        {req.description}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-4 font-mono">
                        ID: {req.id} | {req.createdAt}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                      {req.status === ServiceStatus.PENDING && (
                        <>
                          <AdminButton
                            variant="primary"
                            onClick={() => {
                              setReplyTarget(req);
                              setReplyModalOpen(true);
                            }}
                          >
                            Responder / Agendar
                          </AdminButton>
                          <AdminButton
                            variant="outline"
                            onClick={() => {
                              const u = users.find((x) => x.id === req.userId);
                              if (u) openClientCard(u);
                            }}
                          >
                            Ficha do Cliente
                          </AdminButton>
                        </>
                      )}
                      {req.status === ServiceStatus.SCHEDULED && (
                        <AdminButton
                          variant="success"
                          onClick={() => {
                            setHoursTarget(req);
                            setHoursModalOpen(true);
                          }}
                        >
                          Concluir (Lançar Horas)
                        </AdminButton>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= ABA: CONCIERGE (DE VOLTA E A FUNCIONAR) ================= */}
        {activeTab === "CONCIERGE" && (
          <div className="animate-in slide-in-from-right-10 space-y-8">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                  Concierge — Chat Admin
                </h2>
                <p className="text-slate-500 font-semibold text-sm mt-2">
                  Triagem e conversas rápidas.
                </p>
              </div>
              <div className="w-full md:w-[420px]">
                <input
                  value={conciergeSearch}
                  onChange={(e) => setConciergeSearch(e.target.value)}
                  placeholder="Buscar conversa (nome, ID)..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de Utilizadores do Chat */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Conversas
                  </p>
                </div>
                <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                  {/* Simplificamos a renderização baseada nas mensagens para restaurar a funcionalidade */}
                  {Array.from(new Set(chatMessages?.map((m) => m.userId))).map(
                    (uid) => {
                      const uMessages = chatMessages.filter(
                        (m) => m.userId === uid,
                      );
                      const lastMsg = uMessages[uMessages.length - 1];
                      if (!lastMsg) return null;
                      if (
                        conciergeSearch &&
                        !lastMsg.userName
                          .toLowerCase()
                          .includes(conciergeSearch.toLowerCase())
                      )
                        return null;
                      const isSelected = selectedChatUserId === uid;

                      return (
                        <button
                          key={uid}
                          onClick={() => setSelectedChatUserId(uid)}
                          className={`w-full text-left px-6 py-5 transition-all ${isSelected ? "bg-indigo-600 text-white" : "hover:bg-slate-50"}`}
                        >
                          <p
                            className={`font-black uppercase tracking-widest text-[10px] ${isSelected ? "text-white" : "text-slate-900"}`}
                          >
                            {lastMsg.userName}
                          </p>
                          <p
                            className={`mt-2 text-sm font-semibold line-clamp-1 ${isSelected ? "text-indigo-100" : "text-slate-500"}`}
                          >
                            {lastMsg.text}
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Janela de Mensagens */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[600px]">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                  {selectedChatUserId ? (
                    <p className="text-xl font-black text-slate-900">
                      Chat Ativo
                    </p>
                  ) : (
                    <p className="text-xl font-black text-slate-400">
                      Selecione uma conversa
                    </p>
                  )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {!selectedChatUserId ? (
                    <div className="h-full flex items-center justify-center text-slate-300 font-black uppercase text-xs">
                      Aguardando seleção...
                    </div>
                  ) : (
                    chatMessages
                      .filter((m) => m.userId === selectedChatUserId)
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "ADMIN" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-5 rounded-[1.5rem] text-sm ${msg.sender === "ADMIN" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none font-semibold"}`}
                          >
                            <p>{msg.text}</p>
                            <span className="text-[8px] font-black uppercase mt-2 block opacity-60">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedChatUserId || !adminChatInput.trim()) return;
                      const userName =
                        chatMessages.find(
                          (m) => m.userId === selectedChatUserId,
                        )?.userName || "Usuário";
                      onSendChatMessage(
                        adminChatInput.trim(),
                        "ADMIN",
                        selectedChatUserId,
                        userName,
                      );
                      setAdminChatInput("");
                    }}
                    className="flex gap-4"
                  >
                    <input
                      value={adminChatInput}
                      onChange={(e) => setAdminChatInput(e.target.value)}
                      disabled={!selectedChatUserId}
                      placeholder={
                        selectedChatUserId ? "Escreva a resposta..." : "..."
                      }
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 disabled:opacity-50"
                    />
                    <AdminButton
                      type="submit"
                      variant="dark"
                      className="!rounded-full px-8"
                      disabled={!selectedChatUserId}
                    >
                      Enviar
                    </AdminButton>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA: CLIENTES (TABELA COMPLETA RESTAURADA) ================= */}
        {activeTab === "CLIENTS" && (
          <div className="animate-in slide-in-from-right-10 space-y-6">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              Base de Assinantes
            </h2>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
              <input
                placeholder="Buscar cliente por nome, email ou ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Assinante
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Plano
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                      Ações Inteligentes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users
                    .filter(
                      (u) =>
                        u.name
                          ?.toLowerCase()
                          .includes(clientSearch.toLowerCase()) ||
                        u.email
                          ?.toLowerCase()
                          .includes(clientSearch.toLowerCase()),
                    )
                    .map((u: any) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900 text-base">
                            {u.name}
                          </p>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {u.email}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            ID: {u.id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-md">
                            {u.planName || "—"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {Boolean(u.isBlocked) ? (
                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase">
                              Bloqueado
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                              Ativo
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <AdminButton
                              variant="dark"
                              onClick={() => openClientCard(u)}
                            >
                              Agenda Inteligente
                            </AdminButton>

                            {/* Botão de Reset Mensal */}
                            <AdminButton
                              variant="primary"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Deseja realizar o reset mensal para ${u.name}?`,
                                  )
                                ) {
                                  // Chamar a função original de reset aqui
                                }
                              }}
                            >
                              Reset Mensal
                            </AdminButton>

                            {/* Botão de Bloquear / Desbloquear */}
                            <AdminButton
                              variant={
                                Boolean(u.isBlocked) ? "success" : "danger"
                              }
                              onClick={() =>
                                onUpdateUserStatus(u.id, !Boolean(u.isBlocked))
                              }
                            >
                              {Boolean(u.isBlocked)
                                ? "Desbloquear"
                                : "Bloquear"}
                            </AdminButton>

                            {/* Botão Excluir */}
                            <AdminButton
                              variant="outline"
                              className="!text-red-600 !border-red-200 hover:!bg-red-50"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Tem a certeza que deseja excluir o utilizador "${u.name}"?\nEsta ação é irreversível.`,
                                  )
                                ) {
                                  onDeleteUser(u.id);
                                }
                              }}
                            >
                              Excluir
                            </AdminButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-slate-400 font-bold uppercase text-xs"
                      >
                        Nenhum assinante encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAIS INTELIGENTES (Ficam flutuando sobre a tela quando ativados)
          ========================================================================= */}

      {/* 📅 MODAL 1: FICHA DO CLIENTE / AGENDA UNIVERSAL */}
      {agendaOpen && agendaUser && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setAgendaOpen(false)}
          />
          <div className="relative bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex justify-between">
              Ficha Inteligente{" "}
              <button
                onClick={() => setAgendaOpen(false)}
                className="text-slate-400"
              >
                ×
              </button>
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Cliente
                </p>
                <p className="font-bold text-slate-900 mt-1">
                  {agendaUser.name}
                </p>
                <p className="text-xs text-slate-500">{agendaUser.email}</p>
              </div>

              {/* 📊 Histórico Inteligente (Mockup baseado nos requests do usuário) */}
              <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
                <p className="text-[10px] font-black uppercase text-indigo-400">
                  Histórico de Chamados
                </p>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="text-xs font-bold text-indigo-900">Abertos</p>
                    <p className="text-xl font-black text-indigo-600">
                      {
                        (requests || []).filter(
                          (r) =>
                            r.userId === agendaUser.id &&
                            r.status === ServiceStatus.PENDING,
                        ).length
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700">
                      Concluídos
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      {
                        (requests || []).filter(
                          (r) =>
                            r.userId === agendaUser.id &&
                            r.status === ServiceStatus.COMPLETED,
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end border-t border-slate-100 pt-6">
              <AdminButton
                variant="outline"
                onClick={() => setAgendaOpen(false)}
              >
                Fechar
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* 🔧 MODAL 2: RESPONDER E AGENDAR (Com trava de Data) */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setReplyModalOpen(false)}
          />
          <div className="relative bg-white rounded-[3rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex justify-between">
              Agendar O.S{" "}
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-slate-400"
              >
                ×
              </button>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                  Data do Agendamento (Máx 3 por dia)
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                  Resposta ao Cliente
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold h-32 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <AdminButton
                variant="outline"
                onClick={() => setReplyModalOpen(false)}
              >
                Cancelar
              </AdminButton>
              <AdminButton variant="primary" onClick={submitReplyModal}>
                Validar e Agendar
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* ⏳ MODAL 3: CONCLUIR E LANÇAR HORAS */}
      {hoursModalOpen && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setHoursModalOpen(false)}
          />
          <div className="relative bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              Concluir Chamado
            </h3>
            <input
              value={hoursValue}
              onChange={(e) => setHoursValue(e.target.value)}
              inputMode="decimal"
              placeholder="Horas gastas (Ex: 2.5)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-bold outline-none text-center text-xl mb-6 focus:border-indigo-600"
            />
            <div className="flex justify-between gap-3">
              <AdminButton
                variant="outline"
                className="flex-1"
                onClick={() => setHoursModalOpen(false)}
              >
                Cancelar
              </AdminButton>
              <AdminButton
                variant="success"
                className="flex-1"
                onClick={submitHoursModal}
              >
                Concluir
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
