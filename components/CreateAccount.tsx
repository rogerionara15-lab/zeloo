
import React, { useState } from 'react';

interface CreateAccountProps {
  onFinalize: (credentials: { email: string, password: string }) => void;
  onCancel: () => void;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ onFinalize, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    onFinalize({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-20 animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-emerald-200">
          🔑
        </div>
        
        <div className="text-center mb-10 mt-6">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Configure seu Acesso</h1>
          <p className="text-slate-400 font-medium">Finalize seu cadastro definindo seu e-mail de login e senha.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">E-mail de Login</label>
            <input 
              required 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Senha</label>
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirmar Senha</label>
            <input 
              required 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-bold"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase text-center border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
            >
              Criar Minha Conta Zeloo
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
