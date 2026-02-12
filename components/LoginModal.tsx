import React, { useState } from 'react';
import { UserRole, UserRegistration } from '../types';
import { supabase } from '../services/supabaseClient';
import { accessService } from '../services/accessService';

interface LoginModalProps {
  initialMode: 'CLIENT' | 'ADMIN';
  users: UserRegistration[];
  onClose: () => void;
  onSuccess: (role: UserRole, isMaster: boolean, userData?: UserRegistration) => void;
  onGoToPlans?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ users, onClose, onSuccess, onGoToPlans }) => {
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState(''); // master ou email
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);

  // MASTER (mantemos por enquanto)
  const MASTER_USER = 'master';
  const MASTER_PASS = 'zeloo@admin2024';
  const MASTER_PIN = '0908';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const userLogin = login.trim().toLowerCase();
    const userPass = password.trim();

    try {
      // 1) MASTER ADMIN (continua com PIN)
      if (userLogin === MASTER_USER && userPass === MASTER_PASS) {
        setShowPinScreen(true);
        setLoading(false);
        return;
      }

      // 2) CLIENTE precisa ser email
      if (!userLogin.includes('@')) {
        setLoading(false);
        setError('Digite seu e-mail para entrar como cliente.');
        return;
      }

      // ✅ Login real no Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: userLogin,
        password: userPass,
      });

      if (signInError) {
        setLoading(false);
        setError(`Erro Supabase: ${signInError.message}`);
        return;
      }

      if (!data?.session || !data?.user) {
        setLoading(false);
        setError('Erro Supabase: sessão não criada. Verifique configurações do Auth.');
        return;
      }

      // ✅ AQUI ESTÁ A CORREÇÃO DO "LOGIN UNIVERSAL":
      // Em vez de depender do localStorage, validamos no Supabase se o email está APPROVED em paid_access.
      const approved = await accessService.isEmailApproved(userLogin);

      if (!approved) {
        // Segurança: se não está aprovado, a gente não deixa sessão ativa
        await supabase.auth.signOut();

        setLoading(false);
        setError(
          'Seu acesso ainda não foi liberado.\n' +
          'Se você já pagou, aguarde a confirmação automática ou fale com o suporte Zeloo.'
        );
        return;
      }

      // ✅ Acesso aprovado: agora precisamos entregar um "userData" pro App abrir o Dashboard.
      // Vamos tentar pegar dados do cadastro local (se existir) e, se não existir, criar um mínimo.
      const localUser = users.find(u => u.email.trim().toLowerCase() === userLogin);

      const userData: UserRegistration = (localUser || {
        id: data.user.id,                 // id real do Supabase Auth
        email: userLogin,
        password: '',                     // não guardamos senha
        name: userLogin.split('@')[0],    // nome provisório
        planName: 'Central Essencial Residencial', // provisório (a gente melhora depois)
        date: new Date().toLocaleDateString('pt-BR'),
        dueDate: 'Ativo',
        isBlocked: false,
        extraVisitsPurchased: 0,
        paymentStatus: 'PAID',
      }) as any;

      // Garante que o porteiro do App não bloqueie
      (userData as any).paymentStatus = 'PAID';
      (userData as any).isBlocked = false;

      onSuccess(UserRole.CLIENT, false, userData);
      onClose();
      setLoading(false);

    } catch (err) {
      console.error(err);
      setError('Erro inesperado ao autenticar. Tente novamente.');
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPinArr = [...pin];
    newPinArr[index] = value.slice(-1);
    setPin(newPinArr);
    setPinError(false);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyPin = async () => {
    const enteredPin = pin.join('');

    if (enteredPin === MASTER_PIN) {
      setLoading(true);
      await supabase.auth.signOut(); // evita sessão de cliente ativa
      setTimeout(() => {
        onSuccess(UserRole.ADMIN, true);
        onClose();
      }, 500);
      return;
    }

    setPinError(true);
    setPin(['', '', '', '']);
    document.getElementById('pin-0')?.focus();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {showPinScreen ? (
        <div className="relative w-full max-w-md bg-slate-900 rounded-[3.5rem] p-12 text-center shadow-2xl border border-white/10 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20">
            <span className="text-3xl">🔑</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">PIN Operacional</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
            Insira o código de 4 dígitos para prosseguir
          </p>

          <div className="flex justify-center gap-3 mb-10">
            {pin.map((digit, i) => (
              <input
                key={i}
                id={`pin-${i}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={i === 0}
                onChange={(e) => handlePinChange(i, e.target.value)}
                className={`w-14 h-20 bg-white/5 border-2 rounded-2xl text-center text-3xl font-black text-white outline-none transition-all ${
                  pinError ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                }`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-red-500 text-[9px] font-black uppercase mb-6 animate-bounce">
              PIN Incorreto. Tente novamente.
            </p>
          )}

          <button
            onClick={handleVerifyPin}
            disabled={pin.some((d) => !d) || loading}
            className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Acessando Torre de Comando...' : 'Autenticar Acesso Master'}
          </button>

          <button
            onClick={() => setShowPinScreen(false)}
            className="mt-8 text-slate-500 font-bold text-[9px] uppercase tracking-widest hover:text-white transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95">
          <button
            onClick={onClose}
            className="absolute top-8 right-8 text-slate-300 text-2xl hover:text-slate-900 transition-colors"
          >
            ×
          </button>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100">
              <span className="text-white font-black text-2xl">Z</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Acesso Zeloo</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Painel Administrativo & Cliente</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">
                Usuário ou E-mail
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Ex: master ou seu e-mail"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-slate-400 mb-1.5 ml-1">
                Senha de Segurança
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase text-center border border-red-100 animate-in fade-in slide-in-from-top-2 whitespace-pre-line">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Entrar no Sistema'
              )}
            </button>

            <div className="text-center pt-6">
              <button
                type="button"
                onClick={onGoToPlans}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Ainda não é assinante? Ver Planos
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginModal;
