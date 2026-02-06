import React, { useState } from 'react';

interface ZelooExpressProps {
  isOpen: boolean;
  onClose: () => void;
  lastEstimate: any; // mantido por compatibilidade (não usado agora)
  onBudgetGenerated: (budget: any) => void; // mantido por compatibilidade (não usado agora)
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
}

type TriageData = {
  category: '' | 'Elétrica' | 'Hidráulica' | 'Manutenção';
  urgency: 'Baixa' | 'Média' | 'Alta';
  description: string;
  preferredTime: '' | 'Manhã' | 'Tarde' | 'Noite';
};

const ZelooExpress: React.FC<ZelooExpressProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  onAuthRequired,
}) => {
  const [activeTab, setActiveTab] = useState<'TRIAGE' | 'CHAT'>('TRIAGE');
  const [loading, setLoading] = useState(false);

  const [triage, setTriage] = useState<TriageData>({
    category: '',
    urgency: 'Média',
    description: '',
    preferredTime: '',
  });

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'admin'; text: string }[]>([
    {
      role: 'admin',
      text:
        'Oi! Eu sou o Assistente Zeloo. Eu te ajudo a classificar o problema e encaminhar para o atendimento certo. A avaliação técnica final é sempre presencial. 🙂',
    },
  ]);

  if (!isOpen) return null;

  const quickAdminReplyFromTriage = (t: TriageData) => {
    const base = `Entendi. Categoria: ${t.category || '—'} | Urgência: ${t.urgency}.`;

    const suggestion =
      t.urgency === 'Alta'
        ? 'Se houver risco (choque, curto, vazamento forte), desligue o disjuntor/registro e aguarde o técnico.'
        : 'Vou encaminhar para o atendimento correto e sugerir o melhor horário.';

    const schedule =
      t.preferredTime
        ? `Preferência de horário: ${t.preferredTime}.`
        : 'Se quiser, diga um horário preferido (manhã/tarde/noite).';

    return `${base}\n${suggestion}\n${schedule}`;
  };

  const handleSubmitTriage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se você quiser que o Express seja exclusivo para logado, mantém essa trava.
    // Se quiser liberar para todos, é só remover este bloco.
    if (!isLoggedIn) {
      onAuthRequired?.();
      return;
    }

    setLoading(true);

    // Simula “processamento” sem IA cara / sem SINAPI
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', text: `Quero abrir um chamado.\n${triage.description}` },
        { role: 'admin', text: quickAdminReplyFromTriage(triage) },
        {
          role: 'admin',
          text:
            'Próximo passo: abra um chamado no app (botão “Abrir Chamado de Reparo”) e nossa equipe confirma o agendamento pelo chat.',
        },
      ]);

      setActiveTab('CHAT');
      setLoading(false);
    }, 700);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage.trim();
    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setChatMessage('');

    // Resposta concierge (sem prometer diagnóstico)
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'admin',
          text:
            'Entendido. Para eu encaminhar certinho: isso é elétrica, hidráulica ou manutenção? E é urgente (risco/alarme) ou pode agendar?',
        },
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-end p-0 sm:p-6 pointer-events-none">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-lg h-[90vh] sm:h-[600px] bg-white sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 pointer-events-auto">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">⚡</div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Zeloo Express</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Triagem & Atendimento</p>
            </div>
          </div>
          <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100 transition-opacity">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('TRIAGE')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'TRIAGE' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'
            }`}
          >
            1. Triagem Rápida
          </button>
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'CHAT' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'
            }`}
          >
            2. Concierge Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'TRIAGE' ? (
            <div className="relative h-full">
              {!isLoggedIn && (
                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl mb-4">🔒</div>
                  <h4 className="text-xs font-black uppercase text-slate-900 mb-2">Acesse para Continuar</h4>
                  <p className="text-[10px] text-slate-500 font-bold mb-6 max-w-[220px]">
                    Faça login para abrir triagem e encaminhar seu chamado com prioridade.
                  </p>
                  <button
                    onClick={onAuthRequired}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                  >
                    Entrar Agora
                  </button>
                </div>
              )}

              <div className={`animate-in fade-in slide-in-from-left-4 ${!isLoggedIn ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                <h4 className="font-bold text-slate-900 mb-4">Conte o problema (triagem)</h4>

                <form onSubmit={handleSubmitTriage} className="space-y-4">
                  <select
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                    value={triage.category}
                    onChange={(e) => setTriage({ ...triage, category: e.target.value as any })}
                    required
                  >
                    <option value="">Qual tipo de serviço?</option>
                    <option value="Elétrica">Elétrica</option>
                    <option value="Hidráulica">Hidráulica</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>

                  <select
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                    value={triage.urgency}
                    onChange={(e) => setTriage({ ...triage, urgency: e.target.value as any })}
                  >
                    <option value="Baixa">Urgência baixa</option>
                    <option value="Média">Urgência média</option>
                    <option value="Alta">Urgência alta</option>
                  </select>

                  <select
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                    value={triage.preferredTime}
                    onChange={(e) => setTriage({ ...triage, preferredTime: e.target.value as any })}
                  >
                    <option value="">Horário preferido (opcional)</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>

                  <textarea
                    placeholder="Ex: disjuntor cai quando ligo o chuveiro / vazamento na pia / porta arrastando..."
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-600"
                    value={triage.description}
                    onChange={(e) => setTriage({ ...triage, description: e.target.value })}
                    required
                  />

                  <button
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Encaminhando...' : 'Triar e Encaminhar'}
                  </button>

                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    * O Assistente Zeloo faz triagem e encaminhamento. A avaliação técnica final é sempre presencial.
                  </p>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
              <div className="flex-1 space-y-4 mb-4">
                {chatHistory.length === 0 && (
                  <div className="text-center py-10 opacity-30">
                    <span className="text-4xl block mb-2">👋</span>
                    <p className="text-xs font-bold uppercase tracking-widest">Inicie uma conversa</p>
                  </div>
                )}

                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva sua dúvida ou descreva o problema..."
                  className="flex-1 p-4 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold">
                  ➔
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZelooExpress;
