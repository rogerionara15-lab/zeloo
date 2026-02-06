
import React, { useState } from 'react';

interface CondoBudgetProps {
  onBack: () => void;
}

const CondoBudget: React.FC<CondoBudgetProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    condoName: '',
    units: '',
    syndicName: '',
    phone: '',
    email: '',
    mainNeeds: [] as string[]
  });

  const needsOptions = [
    'Manutenção Elétrica Predial',
    'Limpeza de Reservatórios',
    'Manutenção Hidráulica',
    'Impermeabilização de Telhados',
    'Inspeção Termográfica',
    'Pintura de Áreas Comuns'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 2000);
  };

  const toggleNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      mainNeeds: prev.mainNeeds.includes(need)
        ? prev.mainNeeds.filter(n => n !== need)
        : [...prev.mainNeeds, need]
    }));
  };

  return (
    <div className="pt-32 pb-24 bg-white animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-12"
        >
          <span>←</span> Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-indigo-100">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              Zeloo Enterprise & Condo
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter">
              Gestão Técnica para <br/><span className="text-indigo-600">Condomínios.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Reduza o passivo do condomínio e valorize o patrimônio dos moradores com uma gestão de manutenção previsível, digital e profissionalizada.
            </p>

            <div className="space-y-8">
               {[
                 { title: 'Redução de Custos', desc: 'Até 25% de economia em reparos emergenciais através de preventivas programadas.', icon: '📉' },
                 { title: 'Conformidade Legal', desc: 'Laudos e relatórios técnicos assinados para total segurança do síndico.', icon: '⚖️' },
                 { title: 'Atendimento Ágil', desc: 'Canal exclusivo para o zelador e zeladoria com prioridade máxima.', icon: '🚀' }
               ].map((item, idx) => (
                 <div key={idx} className="flex gap-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 border border-slate-100">{item.icon}</div>
                    <div>
                       <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                       <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
                <span className="text-9xl">🏛️</span>
             </div>

             {sent ? (
               <div className="relative z-10 text-center py-20 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-xl">✓</div>
                  <h3 className="text-3xl font-black mb-4">Solicitação Enviada</h3>
                  <p className="text-slate-400 font-medium mb-12">Nosso gestor de contas Enterprise entrará em contato com você em até 4 horas úteis para agendar uma vistoria diagnóstica gratuita.</p>
                  <button onClick={onBack} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">Voltar ao Início</button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                  <h3 className="text-2xl font-black mb-10">Solicitar Proposta de Gestão</h3>
                  
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome do Condomínio</label>
                           <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nº de Unidades (Aprox.)</label>
                           <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Nome do Síndico / Responsável</label>
                        <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">WhatsApp de Contato</label>
                           <input required type="tel" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">E-mail Corporativo</label>
                           <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-1">Áreas de Interesse</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {needsOptions.map(opt => (
                              <button 
                                key={opt}
                                type="button"
                                onClick={() => toggleNeed(opt)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-left border transition-all ${formData.mainNeeds.includes(opt) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                              >
                                {opt}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-10"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : 'Gerar Orçamento Consultivo'}
                  </button>
               </form>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CondoBudget;
