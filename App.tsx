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
import {
  
  PlanDetails,
  UserRegistration,
  AdminProfile,
  UserRole,
  MaintenanceRequest,
  ServiceStatus,
  BrandingInfo,
  Service,
  ChatMessage
} from './types';
import { BRANDING_DATA } from './constants';

// ✅ helper local (pra não dar erro no arquivar por data)
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

// ✅ PRA TESTAR SEM ESPERAR 7 DIAS:
// Troque temporariamente para 10_000 (10 segundos). Depois volte pra 7 dias.
const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
// const ARCHIVE_AFTER_MS = 10_000;

const App: React.FC = () => {
  const [view, setView] = useState<string>('LANDING');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExpress, setShowExpress] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<any>(null);

  const getFromLocal = useCallback((key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`zeloo_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) { return defaultValue; }
  }, []);

  const saveToLocal = (key: string, data: any) => {
    try { localStorage.setItem(`zeloo_${key}`, JSON.stringify(data)); } catch (e) {}
  };

  const [branding, setBranding] = useState<BrandingInfo>(() => getFromLocal('branding', BRANDING_DATA));
  const [registeredUsers, setRegisteredUsers] = useState<UserRegistration[]>(() => getFromLocal('users', []));
  const [currentUser, setCurrentUser] = useState<UserRegistration | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(() => getFromLocal('requests', []));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => getFromLocal('chat_messages', []));

  const [availablePlans] = useState<PlanDetails[]>([
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
        'Atendimentos extras com valor reduzido'
      ],
      highlight: true,
      save: 'Plano sustentável e sem surpresas'
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
        'Atendimentos extras com valor reduzido'
      ],
      highlight: false
    },
    {
      name: 'Central Essencial Condomínio',
      tier: 'Sob consulta',
      price: 'A partir de R$ 1500',
      period: '/mês',
      features: [
        'Pacote mensal de horas (contrato)',
        'SLA e cobertura personalizada',
        'Equipe qualificada para manutenção predial',
        'Relatórios e histórico de atendimentos'
      ],
      highlight: false,
      save: 'Contrato personalizado'
    }
  ]);

  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => getFromLocal('admin', {
    name: 'Operação Central Zeloo',
    document: '00.000.000/0001-00',
    email: 'admin@zeloo.com',
    phone: '5543996000274',
    mercadoPagoLink: '',
    gatewayStatus: 'DISCONNECTED',
    environment: 'SANDBOX',
    publicKey: '',
    mercadoPagoAccessToken: '',
    pixKey: 'financeiro@zeloo.com'
  }));

  useEffect(() => {
    saveToLocal('branding', branding);
    saveToLocal('users', registeredUsers);
    saveToLocal('requests', maintenanceRequests);
    saveToLocal('admin', adminProfile);
    saveToLocal('chat_messages', chatMessages);
  }, [branding, registeredUsers, maintenanceRequests, adminProfile, chatMessages]);

  // ✅ Sync entre abas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (!e.key.startsWith('zeloo_')) return;

      try {
        if (e.key === 'zeloo_requests') {
          setMaintenanceRequests(e.newValue ? JSON.parse(e.newValue) : []);
        }
        if (e.key === 'zeloo_users') {
          setRegisteredUsers(e.newValue ? JSON.parse(e.newValue) : []);
        }
        if (e.key === 'zeloo_chat_messages') {
          setChatMessages(e.newValue ? JSON.parse(e.newValue) : []);
        }
        if (e.key === 'zeloo_branding') {
          setBranding(e.newValue ? JSON.parse(e.newValue) : BRANDING_DATA);
        }
        if (e.key === 'zeloo_admin') {
          setAdminProfile(e.newValue ? JSON.parse(e.newValue) : adminProfile);
        }
      } catch {
        // ignora
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const navigateTo = useCallback((newView: string) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ✅ “Porteiro” do login (usuário só entra se PAID)
  const handleLogin = (role: UserRole, isMaster: boolean = false, userData?: UserRegistration) => {
    setIsSuperUser(isMaster);

    if (isMaster || role === UserRole.ADMIN) {
      setCurrentUser(null);
      navigateTo('ADMIN_DASHBOARD');
      setShowLoginModal(false);
      return;
    }

    if (!userData) return;

    if (userData.isBlocked) {
      alert('Acesso bloqueado. Fale com o suporte.');
      return;
    }

    if (userData.paymentStatus !== 'PAID') {
      alert('Seu acesso ainda não foi liberado. Envie o comprovante ou aguarde a auditoria.');
      return;
    }

    setCurrentUser(userData);
    navigateTo('DASHBOARD');
    setShowLoginModal(false);
  };

  const handleSendChatMessage = (text: string, sender: 'USER' | 'ADMIN', userId: string, userName: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId,
      userName,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleHandlePaymentAction = (userId: string, action: 'APPROVE' | 'REJECT') => {
    setRegisteredUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          paymentStatus: action === 'APPROVE' ? 'PAID' : 'REJECTED',
          isBlocked: action === 'REJECT'
        };
      }
      return u;
    }));

    if (action === 'APPROVE') {
      alert('Pagamento aprovado com sucesso! O acesso do cliente já está liberado.');
    }

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, paymentStatus: action === 'APPROVE' ? 'PAID' : 'REJECTED' } : null);
    }
  };

  // ✅ AUTO-ARQUIVAMENTO: roda sempre que requests mudarem
  useEffect(() => {
    const now = Date.now();
    let changed = false;

    const updated = maintenanceRequests.map((r) => {
      if (r.archived === true) return r;

      // COMPLETED -> olha completedAt
      if (r.status === ServiceStatus.COMPLETED && r.completedAt) {
        const t = new Date(r.completedAt).getTime();
        if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
          changed = true;
          return { ...r, archived: true };
        }
      }

      // CANCELLED -> olha cancelledAt
      if (r.status === ServiceStatus.CANCELLED && r.cancelledAt) {
        const t = new Date(r.cancelledAt).getTime();
        if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
          changed = true;
          return { ...r, archived: true };
        }
      }

      return r;
    });

    if (changed) {
      setMaintenanceRequests(updated);
    }
  }, [maintenanceRequests]);

  const handleClearOldCompletedRequests = () => {
    const now = Date.now();
    let changed = false;

    setMaintenanceRequests(prev => {
      const next = prev.map((r) => {
        if (r.archived === true) return r;

        if (r.status === ServiceStatus.COMPLETED) {
          const fallback = parsePtBrDate(r.createdAt) || new Date(r.createdAt);
          const completedAt = r.completedAt || (Number.isFinite(fallback.getTime()) ? new Date(fallback).toISOString() : undefined);

          if (completedAt) {
            const t = new Date(completedAt).getTime();
            if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
              changed = true;
              return { ...r, completedAt, archived: true };
            }
            if (!r.completedAt) {
              changed = true;
              return { ...r, completedAt };
            }
          }
        }

        if (r.status === ServiceStatus.CANCELLED) {
          const fallback = parsePtBrDate(r.createdAt) || new Date(r.createdAt);
          const cancelledAt = r.cancelledAt || (Number.isFinite(fallback.getTime()) ? new Date(fallback).toISOString() : undefined);

          if (cancelledAt) {
            const t = new Date(cancelledAt).getTime();
            if (Number.isFinite(t) && now - t > ARCHIVE_AFTER_MS) {
              changed = true;
              return { ...r, cancelledAt, archived: true };
            }
            if (!r.cancelledAt) {
              changed = true;
              return { ...r, cancelledAt };
            }
          }
        }

        return r;
      });

      return changed ? next : prev;
    });

    alert('Verificação concluída ✅ (arquivamento automático aplicado quando cabível)');
  };

  // ✅ TRAVA FINAL: decide se o usuário pode ver o Dashboard
  const currentUserLive = currentUser ? (registeredUsers.find(u => u.id === currentUser.id) || currentUser) : null;
  const canAccessDashboard = !!currentUserLive && currentUserLive.paymentStatus === 'PAID' && !currentUserLive.isBlocked;

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
              onServiceClick={(s) => { setSelectedService(s); navigateTo('SERVICE_SELECTION'); }}
            />
            <AIAssistant onOpenCounselor={() => navigateTo('SMART_COUNSELOR')} />
            <BudgetGenerator isLoggedIn={!!currentUser} onAuthRequired={() => setShowLoginModal(true)} userPlan={currentUser?.planName} />
            <Pricing
              onSelectPlan={(p) => { setSelectedPlan(p); navigateTo('CHECKOUT'); }}
              plans={availablePlans}
              onCondoBudgetClick={() => navigateTo('CONDO_BUDGET')}
              onBusinessBudgetClick={() => navigateTo('SMART_COUNSELOR')}
            />
            <MobileAppVision
              onOpenDashboard={() => {
                // ✅ Não deixa abrir painel se não estiver PAID
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
              {/* ✅ DASHBOARD COM TRAVA FINAL */}
              {view === 'DASHBOARD' && currentUserLive && (
                canAccessDashboard ? (
                  <Dashboard
                    onLogout={() => { setCurrentUser(null); setView('LANDING'); }}
                    userData={currentUserLive}
                    requests={maintenanceRequests.filter(r => r.userId === currentUserLive.id)}
                    chatMessages={chatMessages.filter(m => m.userId === currentUserLive.id)}
                    onSendChatMessage={handleSendChatMessage}
                    onAddRequest={(d, u) => {
                      if (!currentUserLive) return;

                      const newReq: MaintenanceRequest = {
                        id: `req-${Date.now()}`,
                        userId: currentUserLive.id,
                        userName: currentUserLive.name,
                        description: d,
                        isUrgent: u,
                        status: ServiceStatus.PENDING,
                        createdAt: new Date().toLocaleDateString('pt-BR'),
                        visitCost: 0,
                        archived: false,
                      };

                      setMaintenanceRequests(prev => [newReq, ...prev]);
                    }}
                    onGoHome={() => setView('LANDING')}
                    onApproveVisitCost={(rid) => setMaintenanceRequests(p => p.map(r => r.id === rid ? { ...r, status: ServiceStatus.SCHEDULED } : r))}
                    onBuyExtraVisits={(uid, q) => setRegisteredUsers(p => p.map(u => u.id === uid ? { ...u, extraVisitsPurchased: (u.extraVisitsPurchased || 0) + q } : u))}
                  />
                ) : (
                  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-8">
                    <div className="text-center space-y-4 max-w-lg">
                      <div className="text-5xl">⏳</div>
                      <h2 className="text-xl font-black uppercase tracking-widest">Acesso em análise</h2>
                      <p className="text-sm text-slate-300 font-semibold">
                        Seu acesso ainda não foi liberado.<br />
                        Envie o comprovante ou aguarde a auditoria da nossa equipe.
                      </p>
                      <button
                        onClick={() => { setCurrentUser(null); navigateTo('LANDING'); }}
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
                  onUpdateRequestStatus={(id, status, cost) =>
                    setMaintenanceRequests(p => p.map(r => {
                      if (r.id !== id) return r;

                      const next: MaintenanceRequest = {
                        ...r,
                        status,
                        visitCost: cost ?? r.visitCost
                      };

                      if (status === ServiceStatus.COMPLETED && !r.completedAt) {
                        next.completedAt = new Date().toISOString();
                      }
                      if (status === ServiceStatus.CANCELLED && !r.cancelledAt) {
                        next.cancelledAt = new Date().toISOString();
                      }

                      return next;
                    }))
                  }
                  onLogout={() => { setIsSuperUser(false); setView('LANDING'); }}
                  onGoHome={() => setView('LANDING')}
                  onUpdateUserStatus={(uid, b) => setRegisteredUsers(p => p.map(u => u.id === uid ? { ...u, isBlocked: b } : u))}
                  onDeleteUser={(uid) => setRegisteredUsers(p => p.filter(u => u.id !== uid))}
                  onAdminReply={(rid, rep) => setMaintenanceRequests(p => p.map(r => r.id === rid ? { ...r, adminReply: rep } : r))}
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
                  onSuccess={(reg) => { setPendingRegistration(reg); navigateTo('PAYMENT_SUCCESS'); }}
                />
              )}

              {view === 'PAYMENT_SUCCESS' && (
                <PaymentSuccess
                  planName={selectedPlan?.name || ''}
                  onContinue={() => navigateTo('CREATE_ACCOUNT')}
                  paymentStatus={pendingRegistration?.paymentStatus}
                />
              )}

              {/* ✅ AQUI ESTAVA O FURO: não pode entrar direto no dashboard após criar conta */}
              {view === 'CREATE_ACCOUNT' && (
                <CreateAccount
                  onFinalize={(creds) => {
                    const newUser: UserRegistration = {
                      ...pendingRegistration,
                      id: `user-${Date.now()}`,
                      email: creds.email,
                      password: creds.password,
                      date: new Date().toLocaleDateString('pt-BR'),
                      dueDate: 'Ativo',
                      isBlocked: false,
                      extraVisitsPurchased: 0
                    };

                    setRegisteredUsers(prev => [...prev, newUser]);

                    // ✅ Só entra se já estiver PAID (caso raro quando tiver gateway automático no futuro)
                    if (newUser.paymentStatus === 'PAID') {
                      setCurrentUser(newUser);
                      navigateTo('DASHBOARD');
                      return;
                    }

                    // ✅ Caso normal (sem gateway): fica em auditoria e NÃO entra
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
                  onViewPlans={() => { setView('LANDING'); setTimeout(() => document.getElementById('planos')?.scrollIntoView(), 100); }}
                />
              )}
              {view === 'SERVICE_SELECTION' && selectedService && (
                <ServiceSelection
                  service={selectedService}
                  onBack={() => navigateTo('LANDING')}
                  onSelectSubService={() => { if (canAccessDashboard) navigateTo('DASHBOARD'); else setShowLoginModal(true); }}
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
          onGoToPlans={() => { setShowLoginModal(false); document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }); }}
        />
      )}
    </div>
  );
};

export default App;
