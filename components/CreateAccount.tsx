import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface CreateAccountProps {
  onFinalize: (credentials: { email: string; password: string }) => void;
  onCancel: () => void;
  defaultEmail?: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const CreateAccount: React.FC<CreateAccountProps> = ({ onFinalize, onCancel, defaultEmail }) => {
  const location = useLocation();

  const emailFromUrl = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return normalizeEmail(qs.get('email') || '');
  }, [location.search]);

  const lockedEmail = useMemo(() => {
    const e = normalizeEmail(defaultEmail || emailFromUrl || '');
    return e && e.includes('@') ? e : '';
  }, [defaultEmail, emailFromUrl]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  // ✅ mostra aviso de confirmação de e-mail quando necessário
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  // ✅ Preenche email automaticamente se veio da URL
  useEffect(() => {
    if (lockedEmail) setEmail(lockedEmail);
  }, [lockedEmail]);

  // ✅ API: envia link para criar senha (plano B)
  const requestInvite = async (emailToInvite: string) => {
    const resp = await fetch('/api/request-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToInvite }),
    });

    let data: any = {};
    try {
      data = await resp.json();
    } catch {
      // ignore
    }

    if (resp.ok) {
      return { ok: true as const, message: '✅ Link enviado! Verifique seu e-mail para criar a senha.' };
    }

    if (resp.status === 400) {
      return { ok: false as const, message: 'Informe um e-mail válido para enviar o link.' };
    }
    if (resp.status === 403) {
      return { ok: false as const, message: 'Este e-mail ainda não está aprovado no plano. Verifique o pagamento.' };
    }

    const details = data?.details || data?.error;
    return {
      ok: false as const,
      message: `Não foi possível enviar o link agora.${details ? ` (${details})` : ''}`,
    };
  };

  const handleInviteClick = async () => {
    setError(null);
    setInfo(null);

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }

    setInviting(true);

    try {
      const result = await requestInvite(cleanEmail);
      if (result.ok) setInfo(result.message);
      else setError(result.message);
    } catch (err: any) {
      setError(`Erro ao enviar link. (${err?.message || 'erro desconhecido'})`);
    }

    setInviting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setAwaitingEmailConfirm(false);

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    // ✅ 1) Bloqueia criação de conta se não estiver APPROVED no paid_access
    try {
      const checkResp = await fetch('/api/check-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const checkData = await checkResp.json().catch(() => ({}));

      if (!checkResp.ok) {
        const details = checkData?.details || checkData?.error;
        setError(`Erro ao validar seu acesso. Tente novamente em alguns instantes.${details ? ` (${details})` : ''}`);
        setLoading(false);
        return;
      }

      if (!checkData?.approved) {
        setError('Seu e-mail ainda não está aprovado no plano. Finalize o pagamento ou aguarde a confirmação.');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(`Falha de conexão ao validar seu acesso. (${err?.message || 'erro desconhecido'})`);
      setLoading(false);
      return;
    }

    try {
      // ✅ 2) Cria conta no Supabase Auth (login universal)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || 'Não foi possível criar a conta. Tente novamente.');
        setLoading(false);
        return;
      }

      // ✅ Se o projeto exigir confirmação por e-mail, data.session pode vir vazio
      const needsConfirm = !data?.session;

      setLoading(false);

      if (needsConfirm) {
        setAwaitingEmailConfirm(true);
        setInfo(
          `✅ Conta criada! Agora confirme seu e-mail para liberar o acesso. Enviamos um link para: ${cleanEmail}. (Confira também o Spam/Lixo eletrônico.)`
        );
        return;
      }

      // ✅ Se não exigir confirmação, segue fluxo normal
      onFinalize({ email: cleanEmail, password });
    } catch (err: any) {
      console.error(err);
      setError('Erro inesperado ao criar a conta. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-20 animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-emerald-200">
          🔑
        </div>

        <div className="text-center mb-10 mt-6">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Configure seu Acesso</h1>
          <p className="text-slate-400 font-medium">
            Finalize seu cadastro definindo sua senha.
            {lockedEmail ? ' Seu e-mail já foi vinculado ao pagamento.' : ''}
          </p>
        </div>

        {/* Plano B: link por e-mail (discreto) */}
        <div className="mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Já pagou mas ainda não tem senha?
          </p>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Se você está aprovado no plano, clique abaixo para receber um link e criar sua senha (login universal).
          </p>

          <button
            type="button"
            onClick={handleInviteClick}
            disabled={inviting || loading}
            className="mt-4 w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {inviting ? 'Enviando link...' : 'Enviar link para criar senha'}
          </button>

          <p className="mt-3 text-[10px] text-slate-400 font-bold">
            * O link será enviado para o e-mail informado acima.
          </p>
        </div>

        {/* INFO */}
        {info && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-[10px] font-black uppercase text-center border border-emerald-100 mb-4">
            {info}
          </div>
        )}

        {/* Mensagem específica de confirmação */}
        {awaitingEmailConfirm && !info && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-[10px] font-black uppercase text-center border border-amber-100 mb-4">
            ✅ Conta criada! Confirme seu e-mail para liberar o acesso. Confira também o Spam/Lixo eletrônico.
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase text-center border border-red-100 mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              E-mail de Login
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              readOnly={!!lockedEmail}
              className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm outline-none transition-all font-bold
                focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600
                ${lockedEmail ? 'opacity-80 cursor-not-allowed' : ''}`}
            />
            {lockedEmail && (
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Este e-mail veio do pagamento e não pode ser alterado.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Senha
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Confirmar Senha
            </label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-bold"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : 'Criar Minha Conta Zeloo'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full py-4 bg-slate-100 text-slate-700 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-60"
            >
              Voltar
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest">
          Sua segurança é nossa prioridade. Dados criptografados.
        </p>
      </div>
    </div>
  );
};

export default CreateAccount;
