
import React, { useState, useRef, useEffect } from 'react';
import { getMaintenanceAdvice } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SmartCounselorProps {
  onBack: () => void;
  onViewPlans: () => void;
}

const SmartCounselor: React.FC<SmartCounselorProps> = ({ onBack, onViewPlans }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const advice = await getMaintenanceAdvice(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: advice || 'Erro técnico.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-6 w-full flex-grow flex flex-col lg:flex-row gap-12 py-12">
        
        {/* Lado Esquerdo - Info */}
        <div className="lg:w-1/3 space-y-8">
          <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10"><span className="text-9xl">🧠</span></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-black mb-6 leading-tight">Cérebro <br/>Zeloo.</h1>
              <p className="text-slate-400 font-medium mb-12">O primeiro assistente de manutenção que aprende com a planta da sua casa.</p>
              <div className="space-y-4">
                {['Diagnóstico Hidráulico', 'Fogo/Curto Elétrico', 'Infiltração', 'Preventiva'].map(i => (
                  <div key={i} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Sugestões de Triagem</p>
            <div className="space-y-3">
              {[
                'Minha caixa de luz está fazendo barulho.',
                'Tem água brotando do rejunte do banheiro.',
                'Como limpar o filtro do ar condicionado?',
                'Qual o perigo de uma tomada derretida?'
              ].map(q => (
                <button key={q} onClick={() => setInput(q)} className="w-full text-left p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-all">{q}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Direito - Chat */}
        <div className="lg:w-2/3 flex flex-col h-[750px] bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">Z</div>
              <div>
                <h4 className="font-black text-slate-900 uppercase text-xs">Engenheiro IA Zeloo</h4>
                <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Online Agora
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide bg-slate-50/30">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <span className="text-7xl mb-8">🛋️</span>
                <p className="text-xl font-bold text-slate-900">Como está sua casa hoje?</p>
                <p className="text-sm font-medium text-slate-500 max-w-xs mt-2">Relate qualquer anomalia técnica para iniciarmos o diagnóstico preditivo.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-8 rounded-[2.5rem] text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-2xl shadow-indigo-100' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none font-medium shadow-sm'}`}>
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                      <button onClick={onViewPlans} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">Resolver via Assinatura</button>
                      <button onClick={onBack} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all">Sair do Chat</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="flex gap-2 p-6 bg-white rounded-3xl border border-slate-200 w-fit animate-pulse"><div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-100"></div></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-8 bg-white border-t border-slate-100">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Descreva o problema ou anexe uma foto..." className="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] px-10 py-5 text-sm outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium" />
              <button type="submit" className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">➔</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCounselor;
