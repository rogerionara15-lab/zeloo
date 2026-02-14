import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import AIAssistant from './components/AIAssistant';
import BudgetGenerator from './components/BudgetGenerator';
import Pricing from './components/Pricing';
import MobileAppVision from './components/MobileAppVision';
import BusinessModel from './components/BusinessModel';
import BrandingDetails from './components/BrandingDetails';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import Checkout from './components/Checkout';
import CreateAccount from './components/CreateAccount';
import PaymentSuccess from './components/PaymentSuccess';
import SmartCounselor from './components/SmartCounselor';
import ServiceSelection from './components/ServiceSelection';
import CustomConsultation from './components/CustomConsultation';
import CondoBudget from './components/CondoBudget';
import AboutUs from './components/AboutUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import FAQ from './components/FAQ';
import ContactConsultant from './components/ContactConsultant';
import ZelooExpress from './components/ZelooExpress';
import PosPagamento from './components/PosPagamento';

import {
  PlanDetails,
  UserRegistration,
  AdminProfile,
  UserRole,
  MaintenanceRequest,
  ServiceStatus,
  BrandingInfo,
  Service,
  ChatMessage,
} from './types';

import { BRANDING_DATA } from './constants';
import { supabase } from './services/supabaseClient';

// helper local (pra não dar erro no arquivar por data)
const parsePtBrDate = (s: string): Date | null => {
  const parts = s?.split('/');
  if (!parts || parts.length !== 3) return null;

  const [ddStr, mmStr, yyyyStr] = parts;
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);

  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
  return new Date(yyyy, mm - 1, dd);
};

// PRA TESTAR SEM ESPERAR 7 DIAS:
// const ARCHIVE_AFTER_MS = 10_000;
const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

// ✅ ID sempre UUID (sem fallback "id-123" que quebra colunas uuid)
const makeUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  // fallback v4 (raríssimo hoje, mas garante UUID válido)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ----------------------
// MAPPERS (Supabase <-> Types)
// ----------------------
const mapRequestRowToRequest = (row: any): MaintenanceRequest => {
  return {
    id: String(row.id ?? ''),
    userId: String(row.user_id ?? row.userId ?? ''),
    userName: String(row.user_name ?? row.userName ?? 'Cliente'),
    description: String(row.description ?? ''),
    isUrgent: Boolean(row.is_urgent ?? row.isUrgent ?? false),
    status: (row.status ?? ServiceStatus.PENDING) as any,
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString('pt-BR')
      : (row.createdAt ?? new Date().toLocaleDateString('pt-BR')),
    visitCost:
      typeof row.visit_cost === 'number'
        ? row.visit_cost
        : typeof row.visitCost === 'number'
          ? row.visitCost
          : (row.visit_cost != null ? Number(row.visit_cost) : 0),
    archived: Boolean(row.archived ?? false),
    adminReply: row.admin_reply ?? row.adminReply,
    completedAt: row.completed_at ?? row.completedAt,
    cancelledAt: row.cancelled_at ?? row.cancelledAt,
  } as any;
};

const mapChatRowToChatMessage = (row: any): ChatMessage => {
  const iso = row.created_at ?? row.timestamp ?? new Date().toISOString();
  const timeLabel =
    typeof iso === 'string'
      ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return {
    id: String(row.id ?? ''),
    userId: String(row.user_id ?? row.userId ?? ''),
    userName: String(row.user_name ?? row.userName ?? 'Usuário'),
    text: String(row.text ?? ''),
    sender: (row.sender ?? 'USER') as any,
    timestamp: timeLabel,
  } as any;
};

const mapUserRowToUser = (row: any): UserRegistration => {
  return {
    id: String(row.id ?? ''),
    name: row.name ?? row.user_name ?? 'Cliente',
    email: row.email ?? '',
    password: row.password_hash ?? '',

    planName: row.plan_name ?? row.planName ?? '',
    paymentStatus: row.payment_status ?? row.paymentStatus ?? 'PENDING',
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked ?? false),
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : (row.date ?? new Date().toLocaleDateString('pt-BR')),
    dueDate: row.due_date ?? row.dueDate ?? 'Ativo',
    extraVisitsPurchased: row.extra_visits_purchased ?? row.extraVisitsPurchased ?? 0,

    address: row.address,
    number: row.number,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    zip: row.zip,
    complement: row.complement,
  } as any;
};

// ----------------------
// Local cache helpers (mantidos SOMENTE para branding/admin)
// ----------------------
const getFromLocal = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`zeloo_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(`zeloo_${key}`, JSON.stringify(data));
  } catch {}
};

// ✅ troca URL sem recarregar (não perde estado)
const replaceUrl = (path: string) => {
  try {
    window.history.replaceState({}, '', path);
  } catch {}
};
const PosExtra: React.FC<{ supabase: any }> = ({ supabase }) => {
  const [status, setStatus] = React.useState<'LOADING' | 'OK' | 'FAIL'>('LOADING');
  const [message, setMessage] = React.useState<string>('Processando seu atendimento extra...');

  React.useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email') || '';
        const qtd = Number(params.get('qtd') || '1');
        const st = params.get('status'); // failure/pending etc.

        if (st === 'failure') {
          setStatus('FAIL');
          setMessage('Pagamento não concluído (falha). Tente novamente.');
          return;
        }
        if (st === 'pending') {
          setStatus('FAIL');
          setMessage('Pagamento pendente. Assim que aprovar, o crédito cai automaticamente.');
          return;
        }

        if (!email) {
          setStatus('FAIL');
          setMessage('Email ausente no retorno do pagamento. Fale com o suporte.');
          return;
        }

        // 1) buscar usuário pelo email
        const { data: user, error: uErr } = await supabase
          .from('users')
          .select('id, extra_visits_purchased')
          .eq('email', email)
          .single();

        if (uErr || !user) {
          setStatus('FAIL');
          setMessage('Não encontrei seu usuário no sistema. Fale com o suporte.');
          return;
        }

        const current = Number(user.extra_visits_purchased || 0);
        const add = Number.isFinite(qtd) ? qtd : 1;
        const next = current + add;

        // 2) atualizar créditos
        const { error: upErr } = await supabase
          .from('users')
          .update({ extra_visits_purchased: next })
          .eq('id', user.id);

        if (upErr) {
          setStatus('FAIL');
          setMessage('Falha ao liberar seu crédito. Fale com o suporte.');
          return;
        }

        setStatus('OK');
        setMessage(`✅ Crédito liberado! Você recebeu +${add} atendimento(s) extra(s).`);

        // 3) voltar pra home
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } catch (e) {
        setStatus('FAIL');
        setMessage('Erro inesperado ao liberar extra.');
      }
    };

    run();
  }, [supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
      <div className="max-w-md w-full bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="text-2xl font-black">Zeloo</div>
        <div className="mt-3 text-sm text-white/80">{message}</div>

        {status !== 'LOADING' && (
          <button
            className="mt-6 w-full py-3 rounded-xl bg-indigo-500 text-white font-black"
            onClick={() => (window.location.href = '/')}
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<string>('LANDING');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExpress, setShowExpress] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<any>(null);

  const [branding, setBranding] = useState<BrandingInfo>(() => getFromLocal('branding', BRANDING_DATA));

  // ✅ Sempre começa vazio e hidrata do Supabase
  const [registeredUsers, setRegisteredUsers] = useState<UserRegistration[]>([]);
  const [currentUser, setCurrentUser] = useState<UserRegistration | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [availablePlans] = useState<PlanDetails[]>([
    {
      name: 'Plano Teste (R$ 1)',
      tier: 'Mensal',
      price: 'R$ 1',
      period: '/mês',
      features: ['Teste do pagamento', 'Verificação do webhook', 'Liberação automática (teste)'],
      highlight: false,
      save: 'Plano temporário para teste',
    },
    {
      name: 'Central Essencial Residencial',
      tier: 'Mensal',
      price: 'R$ 300',
      period: '/mês',
      features: [
        '2 atendimentos/mês (até 3h cada)',
        'Total: 6 horas técnicas/mês',
        'Hora técnica inclui deslocamento + diagnóstico + execução',
        'Atendimento prioritário',
        'Materiais à parte',
        'Atendimentos extras com valor reduzido',
      ],
      highlight: true,
      save: 'Plano sustentável e sem surpresas',
    },
    {
      name: 'Central Essencial Comercial',
      tier: 'Mensal',
      price: 'R$ 600',
      period: '/mês',
      features: [
        '4 atendimentos/mês (até 3h cada)',
        'Total: 12 horas técnicas/mês',
        'SLA: atendimento em até 48h (padrão)',
        'Hora técnica inclui deslocamento + diagnóstico + execução',
        'Materiais à parte',
        'Atendimentos extras com valor reduzido',
      ],
      highlight: false,
    },
    {
      name: 'Central Essencial Condomínio',
      tier: 'Sob consulta',
      price: 'A partir de R$ 1500',
      period: '/mês',
      features: ['Pacote mensal de horas (contrato)', 'SLA e cobertura personalizada', 'Equipe qualificada para manutenção predial', 'Relatórios e histórico de atendimentos'],
      highlight: false,
      save: 'Contrato personalizado',
    },
  ]);

  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() =>
    getFromLocal('admin', {
      name: 'Operação Central Zeloo',
      document: '00.000.000/0001-00',
      email: 'admin@zeloo.com',
      phone: '5543996000274',
      mercadoPagoLink: '',
      gatewayStatus: 'DISCONNECTED',
      environment: 'SANDBOX',
      publicKey: '',
      mercadoPagoAccessToken: '',
      pixKey: 'financeiro@zeloo.com',
    })
  );

  // ----------------------
  // Hydrate do Supabase
  // ----------------------
  useEffect(() => {
    const hydrate = async () => {
      const [uRes, rRes, cRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('requests').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
      ]);

      if (uRes.error) console.warn('Supabase users error:', uRes.error);
      if (rRes.error) console.warn('Supabase requests error:', rRes.error);
      if (cRes.error) console.warn('Supabase chat_messages error:', cRes.error);

      setRegisteredUsers((uRes.data || []).map(mapUserRowToUser));
      setMaintenanceRequests((rRes.data || []).map(mapRequestRowToRequest));
      setChatMessages((cRes.data || []).map(mapChatRowToChatMessage));
    };

    hydrate();
  }, []);

  // ----------------------
  // Realtime
  // ----------------------
  useEffect(() => {
    const ch = supabase
      .channel('zeloo-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        const event = payload.eventType;
        const newRow: any = payload.new;
        const oldRow: any = payload.old;

        if (event === 'DELETE') {
          setMaintenanceRequests((prev) => prev.filter((r) => r.id !== String(oldRow?.id)));
          return;
        }

        const mapped = mapRequestRowToRequest(newRow);
        setMaintenanceRequests((prev) => {
          const idx = prev.findIndex((r) => r.id === mapped.id);
          if (idx >= 0) {
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...mapped };
            return copy;
          }
          return [mapped, ...prev];
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
        const event = payload.eventType;
        const newRow: any = payload.new;
        const oldRow: any = payload.old;

        if (event === 'DELETE') {
          setChatMessages((prev) => prev.filter((m) => m.id !== String(oldRow?.id)));
          return;
        }

        const mapped = mapChatRowToChatMessage(newRow);
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        const event = payload.eventType;
        const newRow: any = payload.new;
        const oldRow: any = payload.old;

        if (event === 'DELETE') {
          setRegisteredUsers((prev) => prev.filter((u) => u.id !== String(oldRow?.id)));
          return;
        }

        const mapped = mapUserRowToUser(newRow);
        setRegisteredUsers((prev) => {
          const idx = prev.findIndex((u) => u.id === mapped.id);
          if (idx >= 0) {
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...mapped };
            return copy;
          }
          return [mapped, ...prev];
        });
      });

    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // cache local só branding/admin
  useEffect(() => {
    saveToLocal('branding', branding);
    saveToLocal('admin', adminProfile);
  }, [branding, adminProfile]);

  const navigateTo = useCallback((newView: string) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // porteiro do login
  const handleLogin = (role: UserRole, isMaster: boolean = false, userData?: UserRegistration) => {
    setIsSuperUser(isMaster);

    if (isMaster || role === UserRole.ADMIN) {
      setCurrentUser(null);
      navigateTo('ADMIN_DASHBOARD');
      setShowLoginModal(false);
      return;
    }

    if (!userData) return;

    if ((userData as any).isBlocked) {
      alert('Acesso bloqueado. Fale com o suporte.');
      return;
    }

    if ((userData as any).paymentStatus !== 'PAID') {
      alert('Seu acesso ainda não foi liberado. Envie o comprovante ou aguarde a auditoria.');
      return;
    }

    setCurrentUser(userData);
    navigateTo('DASHBOARD');
    setShowLoginModal(false);
  };

  // chat
  const handleSendChatMessage = async (text: string, sender: 'USER' | 'ADMIN', userId: string, userName: string) => {
    const newMessage: ChatMessage = {
      id: makeUuid(),
      userId,
      userName,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMessage]);

    const { error } = await supabase.from('chat_messages').insert([
      {
        id: newMessage.id,
        user_id: newMessage.userId,
        user_name: newMessage.userName,
        text: newMessage.text,
        sender: newMessage.sender,
      },
    ]);

    if (error) console.warn('Falha ao salvar chat no Supabase:', error);
  };

  // aprovar/reprovar pagamento
  const handleHandlePaymentAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    const paymentStatus = action === 'APPROVE' ? 'PAID' : 'REJECTED';
    const isBlocked = action === 'REJECT';

    setRegisteredUsers((prev) =>
      prev.map((u) => (u.id === userId ? ({ ...u, paymentStatus, isBlocked } as any) : u))
    );

    const { error } = await supabase.from('users').update({ payment_status: paymentStatus, is_blocked: isBlocked }).eq('id', userId);
    if (error) console.warn('Falha ao atualizar pagamento no Supabase:', error);

    if (action === 'APPROVE') alert('Pagamento aprovado com sucesso! O acesso do cliente já está liberado.');

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? ({ ...prev, paymentStatus } as any) : null));
    }
  };

  // auto-arquivamento
  useEffect(() => {
    const now = Date.now();
    let changed = false;

    const updated = maintenanceRequests.map((r) => {
      if ((r as any).archived === true) return r;

      if (r.status === ServiceStatus.COMPLETED && (r as any).completedAt) {
        const t = new Date((r as any).completedAt).getTime();
        if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
          changed = true;
          return { ...(r as any), archived: true };
        }
      }

      if (r.status === ServiceStatus.CANCELLED && (r as any).cancelledAt) {
        const t = new Date((r as any).cancelledAt).getTime();
        if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
          changed = true;
          return { ...(r as any), archived: true };
        }
      }

      return r;
    });

    if (changed) setMaintenanceRequests(updated);
  }, [maintenanceRequests]);

  const handleClearOldCompletedRequests = () => {
    const now = Date.now();
    let changed = false;

    setMaintenanceRequests((prev) => {
      const next = prev.map((r) => {
        if ((r as any).archived === true) return r;

        if (r.status === ServiceStatus.COMPLETED) {
          const fallback = parsePtBrDate((r as any).createdAt) || new Date((r as any).createdAt);
          const completedAt =
            (r as any).completedAt ||
            (Number.isFinite(fallback.getTime()) ? new Date(fallback).toISOString() : undefined);

          if (completedAt) {
            const t = new Date(completedAt).getTime();
            if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
              changed = true;
              return { ...(r as any), completedAt, archived: true };
            }
            if (!(r as any).completedAt) {
              changed = true;
              return { ...(r as any), completedAt };
            }
          }
        }

        if (r.status === ServiceStatus.CANCELLED) {
          const fallback = parsePtBrDate((r as any).createdAt) || new Date((r as any).createdAt);
          const cancelledAt =
            (r as any).cancelledAt ||
            (Number.isFinite(fallback.getTime()) ? new Date(fallback).toISOString() : undefined);

          if (cancelledAt) {
            const t = new Date(cancelledAt).getTime();
            if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
              changed = true;
              return { ...(r as any), cancelledAt, archived: true };
            }
            if (!(r as any).cancelledAt) {
              changed = true;
              return { ...(r as any), cancelledAt };
            }
          }
        }

        return r;
      });

      return changed ? next : prev;
    });

    alert('Verificação concluída ✅ (arquivamento automático aplicado quando cabível)');
  };

  // trava final
  const currentUserLive = currentUser ? (registeredUsers.find((u) => u.id === currentUser.id) || currentUser) : null;
  const canAccessDashboard =
    !!currentUserLive && (currentUserLive as any).paymentStatus === 'PAID' && !(currentUserLive as any).isBlocked;

  const pathname = window.location.pathname;
  if (pathname === '/pos-extra') {
  return <PosExtra supabase={supabase} />;
}

// /pos-extra?email=...&qtd=1 -> adiciona créditos no Supabase e volta pra home
if (pathname === '/pos-extra') {
  return <PosExtra supabase={supabase} />;
}

  // /pos-pagamento
  if (pathname === '/pos-pagamento') {
    return (
      <PosPagamento
        onBack={() => {
          replaceUrl('/');
        }}
        onApproved={(email) => {
          setPendingRegistration((prev: any) => ({
            ...(prev || {}),
            email,
            paymentStatus: 'PAID',
          }));
          replaceUrl(`/criar-conta?email=${encodeURIComponent(email)}`);
        }}
      />
    );
  }

  // /criar-conta
  if (pathname === '/criar-conta') {
    return (
      <CreateAccount
        onFinalize={async (creds) => {
          // ✅ NÃO cria usuário local antes de salvar no Supabase
          const payload = {
            name: (pendingRegistration?.name ?? '') as string,
            email: creds.email,
            password_hash: creds.password,

            plan_name: (pendingRegistration?.planName ?? '') as string,
            payment_status: 'PAID',
            is_blocked: false,
            extra_visits_purchased: 0,
          };

          const { data, error } = await supabase.from('users').insert([payload]).select('*').single();

          if (error) {
            console.error('❌ Falha ao salvar usuário no Supabase:', error);
            alert(`Falha ao criar usuário:\n${error.message}`);
            return;
          }

          const savedUser = mapUserRowToUser(data);

          // atualiza estado com o usuário REAL (uuid do Supabase)
          setRegisteredUsers((prev) => [savedUser, ...prev]);
          setCurrentUser(savedUser);
          setView('DASHBOARD');

          // volta pra "/" sem reload (mantém estado)
          replaceUrl('/');
        }}
        onCancel={() => {
          replaceUrl('/');
        }}
      />
    );
  }

  // app principal
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-600 selection:text-white">
      {view === 'LANDING' && <Header onOpenLogin={() => setShowLoginModal(true)} />}

      <main className="flex-grow">
        {view === 'LANDING' && (
          <div className="animate-in fade-in duration-1000">
            <Hero
              onConsultPlans={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
              onOpenLogin={() => setShowLoginModal(true)}
              onOpenAssistant={() => navigateTo('SMART_COUNSELOR')}
              branding={branding}
            />
            <Services
              onConsultCustomized={() => navigateTo('CUSTOM_CONSULTATION')}
              onServiceClick={(s) => {
                setSelectedService(s);
                navigateTo('SERVICE_SELECTION');
              }}
            />
            <AIAssistant onOpenCounselor={() => navigateTo('SMART_COUNSELOR')} />
            <BudgetGenerator isLoggedIn={!!currentUser} onAuthRequired={() => setShowLoginModal(true)} userPlan={(currentUser as any)?.planName} />
            <Pricing
              onSelectPlan={(p) => {
                setSelectedPlan(p);
                navigateTo('CHECKOUT');
              }}
              plans={availablePlans}
              onCondoBudgetClick={() => navigateTo('CONDO_BUDGET')}
              onBusinessBudgetClick={() => navigateTo('SMART_COUNSELOR')}
            />
            <MobileAppVision
              onOpenDashboard={() => {
                if (canAccessDashboard) navigateTo('DASHBOARD');
                else setShowLoginModal(true);
              }}
              onOpenDiagnosis={() => navigateTo('SMART_COUNSELOR')}
            />
            <BusinessModel />
            <BrandingDetails branding={branding} />
            <Footer
              branding={branding}
              onAboutUsClick={() => navigateTo('ABOUT_US')}
              onPrivacyClick={() => navigateTo('PRIVACY')}
              onTermsClick={() => navigateTo('TERMS')}
              onFAQClick={() => navigateTo('FAQ')}
              onContactClick={() => navigateTo('CONTACT')}
              onClientAreaClick={() => setShowLoginModal(true)}
            />
            <button
              onClick={() => setShowExpress(true)}
              className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white"
            >
              ⚡
            </button>
            {showExpress && (
              <ZelooExpress
                isOpen={showExpress}
                onClose={() => setShowExpress(false)}
                lastEstimate={null}
                onBudgetGenerated={() => {}}
                isLoggedIn={!!currentUser}
                onAuthRequired={() => setShowLoginModal(true)}
              />
            )}
          </div>
        )}

        {view !== 'LANDING' && (
          <div className="relative h-full flex flex-col">
            {!['DASHBOARD', 'ADMIN_DASHBOARD'].includes(view) && (
              <div className="max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-50 rounded-b-2xl shadow-sm">
                <button
                  onClick={() => navigateTo('LANDING')}
                  className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest border border-slate-200 px-4 py-2 rounded-xl"
                >
                  ← Voltar
                </button>
                <div className="font-black text-indigo-600 text-sm tracking-tighter uppercase">{branding.name}.Cloud</div>
              </div>
            )}

            <div className="flex-grow animate-in fade-in slide-in-from-bottom-4 duration-500">
              {view === 'DASHBOARD' && currentUserLive && (
                canAccessDashboard ? (
                  <Dashboard
                    onLogout={() => {
                      setCurrentUser(null);
                      setView('LANDING');
                    }}
                    userData={currentUserLive}
                    requests={maintenanceRequests.filter((r) => (r as any).userId === currentUserLive.id)}
                    chatMessages={chatMessages.filter((m) => (m as any).userId === currentUserLive.id)}
                    onSendChatMessage={handleSendChatMessage}
                    onAddRequest={async (d, u) => {
                      if (!currentUserLive) return;

                      const { data, error } = await supabase
                        .from('requests')
                        .insert([
                          {
                            user_id: currentUserLive.id,
                            user_name: (currentUserLive as any).name,
                            description: d,
                            is_urgent: Boolean(u),
                            status: ServiceStatus.PENDING,
                            visit_cost: 0,
                            archived: false,
                          },
                        ])
                        .select('*')
                        .single();

                      if (error) {
                        console.error('❌ Falha ao salvar chamado no Supabase:', error);
                        alert(`Falha ao salvar chamado:\n${error.message}`);
                        return;
                      }

                      const mapped = mapRequestRowToRequest(data);
                      setMaintenanceRequests((prev) => [mapped, ...prev]);
                    }}
                    onGoHome={() => setView('LANDING')}
                    onApproveVisitCost={async (rid) => {
                      setMaintenanceRequests((p) =>
                        p.map((r) => ((r as any).id === rid ? ({ ...(r as any), status: ServiceStatus.SCHEDULED } as any) : r))
                      );

                      const { error } = await supabase.from('requests').update({ status: ServiceStatus.SCHEDULED }).eq('id', rid);
                      if (error) console.warn('Falha ao atualizar status (SCHEDULED) no Supabase:', error);
                    }}
                    onBuyExtraVisits={(uid, q) =>
                      setRegisteredUsers((p) =>
                        p.map((u) =>
                          (u as any).id === uid
                            ? ({ ...(u as any), extraVisitsPurchased: ((u as any).extraVisitsPurchased || 0) + q } as any)
                            : u
                        )
                      )
                    }
                  />
                ) : (
                  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
                    <div className="text-center space-y-4 max-w-lg">
                      <div className="text-5xl">⏳</div>
                      <h2 className="text-xl font-black uppercase tracking-widest">Acesso em análise</h2>
                      <p className="text-sm text-slate-300 font-semibold">
                        Seu acesso ainda não foi liberado.
                        <br />
                        Envie o comprovante ou aguarde a auditoria da nossa equipe.
                      </p>
                      <button
                        onClick={() => {
                          setCurrentUser(null);
                          navigateTo('LANDING');
                        }}
                        className="mt-6 px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                      >
                        Voltar para Home
                      </button>
                    </div>
                  </div>
                )
              )}

              {view === 'ADMIN_DASHBOARD' && (
                <AdminDashboard
                  onClearOldCompletedRequests={handleClearOldCompletedRequests}
                  profile={adminProfile}
                  setProfile={setAdminProfile}
                  users={registeredUsers}
                  requests={maintenanceRequests}
                  chatMessages={chatMessages}
                  onSendChatMessage={handleSendChatMessage}
                  onUpdateRequestStatus={async (id, status, cost) => {
                    setMaintenanceRequests((p) =>
                      p.map((r) => {
                        if ((r as any).id !== id) return r;

                        const next: MaintenanceRequest = {
                          ...(r as any),
                          status,
                          visitCost: cost ?? (r as any).visitCost,
                        } as any;

                        if (status === ServiceStatus.COMPLETED && !(r as any).completedAt) (next as any).completedAt = new Date().toISOString();
                        if (status === ServiceStatus.CANCELLED && !(r as any).cancelledAt) (next as any).cancelledAt = new Date().toISOString();

                        return next;
                      })
                    );

                    const payload: any = { status };
                    if (typeof cost === 'number') payload.visit_cost = cost;
                    if (status === ServiceStatus.COMPLETED) payload.completed_at = new Date().toISOString();
                    if (status === ServiceStatus.CANCELLED) payload.cancelled_at = new Date().toISOString();

                    const { error } = await supabase.from('requests').update(payload).eq('id', id);
                    if (error) console.warn('Falha ao atualizar request no Supabase:', error);
                  }}
                  onLogout={() => {
                    setIsSuperUser(false);
                    setView('LANDING');
                  }}
                  onGoHome={() => setView('LANDING')}
                  onUpdateUserStatus={async (uid, b) => {
                    setRegisteredUsers((p) => p.map((u) => ((u as any).id === uid ? ({ ...(u as any), isBlocked: b } as any) : u)));
                    const { error } = await supabase.from('users').update({ is_blocked: b }).eq('id', uid);
                    if (error) console.warn('Falha ao atualizar bloqueio no Supabase:', error);
                  }}
                  onDeleteUser={async (uid) => {
                    setRegisteredUsers((p) => p.filter((u) => (u as any).id !== uid));
                    const { error } = await supabase.from('users').delete().eq('id', uid);
                    if (error) console.warn('Falha ao deletar usuário no Supabase:', error);
                  }}
                  onAdminReply={async (rid, rep) => {
                    setMaintenanceRequests((p) => p.map((r) => ((r as any).id === rid ? ({ ...(r as any), adminReply: rep } as any) : r)));
                    const { error } = await supabase.from('requests').update({ admin_reply: rep }).eq('id', rid);
                    if (error) console.warn('Falha ao salvar resposta admin no Supabase:', error);
                  }}
                  onHandlePaymentAction={handleHandlePaymentAction}
                  branding={branding}
                  setBranding={setBranding}
                />
              )}

              {view === 'CHECKOUT' && selectedPlan && (
                <Checkout
                  plan={selectedPlan}
                  adminConfig={adminProfile}
                  onCancel={() => navigateTo('LANDING')}
                  onSuccess={(reg) => {
                    setPendingRegistration(reg);
                    navigateTo('PAYMENT_SUCCESS');
                  }}
                />
              )}

              {view === 'PAYMENT_SUCCESS' && (
                <PaymentSuccess
                  planName={selectedPlan?.name || ''}
                  paymentStatus={pendingRegistration?.paymentStatus}
                  onContinue={() => navigateTo('CREATE_ACCOUNT')}
                  onConfirmPayment={() => {
                    replaceUrl('/pos-pagamento');
                  }}
                />
              )}

              {view === 'CREATE_ACCOUNT' && (
                <CreateAccount
                  onFinalize={async (creds) => {
                    // ✅ NÃO cria usuário local antes de salvar no Supabase
                    const payload = {
                      name: (pendingRegistration?.name ?? '') as string,
                      email: creds.email,
                      password_hash: creds.password,

                      plan_name: (pendingRegistration?.planName ?? '') as string,
                      payment_status: (pendingRegistration?.paymentStatus ?? 'PENDING') as any,
                      is_blocked: false,
                      extra_visits_purchased: 0,
                    };

                    const { data, error } = await supabase.from('users').insert([payload]).select('*').single();

                    if (error) {
                      console.error('❌ Falha ao salvar usuário no Supabase:', error);
                      alert(`Falha ao criar usuário:\n${error.message}`);
                      return;
                    }

                    const savedUser = mapUserRowToUser(data);
                    setRegisteredUsers((prev) => [savedUser, ...prev]);

                    if ((savedUser as any).paymentStatus === 'PAID') {
                      setCurrentUser(savedUser);
                      navigateTo('DASHBOARD');
                      return;
                    }

                    setCurrentUser(null);
                    alert('Cadastro criado ✅ Agora envie o comprovante e aguarde a auditoria para liberar o acesso.');
                    navigateTo('LANDING');
                    setShowLoginModal(true);
                  }}
                  onCancel={() => navigateTo('LANDING')}
                />
              )}

              {view === 'SMART_COUNSELOR' && (
                <SmartCounselor
                  onBack={() => navigateTo('LANDING')}
                  onViewPlans={() => {
                    setView('LANDING');
                    setTimeout(() => document.getElementById('planos')?.scrollIntoView(), 100);
                  }}
                />
              )}

              {view === 'SERVICE_SELECTION' && selectedService && (
                <ServiceSelection
                  service={selectedService}
                  onBack={() => navigateTo('LANDING')}
                  onSelectSubService={() => {
                    if (canAccessDashboard) navigateTo('DASHBOARD');
                    else setShowLoginModal(true);
                  }}
                />
              )}

              {view === 'CUSTOM_CONSULTATION' && <CustomConsultation onBack={() => navigateTo('LANDING')} />}
              {view === 'CONDO_BUDGET' && <CondoBudget onBack={() => navigateTo('LANDING')} />}
              {view === 'ABOUT_US' && <AboutUs onBack={() => navigateTo('LANDING')} onContact={() => navigateTo('CONTACT')} />}
              {view === 'PRIVACY' && <PrivacyPolicy onBack={() => navigateTo('LANDING')} />}
              {view === 'TERMS' && <TermsOfUse onBack={() => navigateTo('LANDING')} onPrivacyClick={() => navigateTo('PRIVACY')} />}
              {view === 'FAQ' && <FAQ onBack={() => navigateTo('LANDING')} onContact={() => navigateTo('CONTACT')} />}
              {view === 'CONTACT' && <ContactConsultant onBack={() => navigateTo('LANDING')} />}
            </div>
          </div>
        )}
      </main>

      {showLoginModal && (
        <LoginModal
          initialMode="CLIENT"
          users={registeredUsers}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLogin}
          onGoToPlans={() => {
            setShowLoginModal(false);
            document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};

export default App;
