
import React, { useState } from 'react';

interface CustomConsultationProps {
  onBack: () => void;
}

const CustomConsultation: React.FC<CustomConsultationProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 2000);
  };

  return (
    <div className="pt-32 pb-24 bg-slate-950 min-h-screen text-white animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-12"
        >
          <span>←</span> Voltar ao Início
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-8 border border-indigo-500/20">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Zeloo Black Label
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-8 tracking-tighter">
              A Excelência que seu <span className="text-indigo-500">Patrimônio</span> merece.
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed mb-12">
              Desenvolvemos planos de manutenção exclusivos para residências de alto padrão, integrando tecnologia preditiva e suporte concierge 24/7.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               {[
                 { title: 'Técnicos Senior', desc: 'Equipe especializada em sistemas complexos e automação.', icon: '🤵' },
                 { title: 'Gestão Total', desc: 'Cuidamos de tudo, do telhado aos sistemas de filtragem.', icon: '🏰' },
                 { title: 'Privacidade', desc: 'Protocolos de segurança e discrição absoluta no atendimento.', icon: '🛡️' },
                 { title: 'Relatórios VIP', desc: 'Dashboards detalhados sobre a valorização do seu imóvel.', icon: '📈' }
               ].map((item, idx) => (
                 <div key={idx} className="space-y-2">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h4 className="font-bold text-white text-lg">{item.title}</h4>
                    <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[4rem] p-10 md:p-16 text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden border border-white/10">
             {sent ? (
               <div className="text-center py-20 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-xl text-white">💎</div>
                  <h3 className="text-3xl font-black mb-4">Solicitação VIP Recebida</h3>
                  <p className="text-slate-500 font-medium mb-12">Um de nossos Gerentes de Conta Black entrará em contato via telefone para agendar uma visita técnica consultiva.</p>
                  <button onClick={onBack} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Voltar ao Site</button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-8">
                  <h3 className="text-2xl font-black mb-10 tracking-tight">Personalize seu Atendimento</h3>
                  
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Seu Nome / Razão</label>
                        <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all font-bold" />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">WhatsApp Premium</label>
                           <input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Metragem (m²)</label>
                           <input required type="number" placeholder="Ex: 800" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Sistemas Específicos</label>
                        <div className="grid grid-cols-2 gap-3">
                           {['Piscina / SPA', 'Automação', 'Energia Solar', 'Ar Central', 'Jardim / Irrigação', 'Elevadores'].map(opt => (
                              <label key={opt} className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors">
                                 <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                 <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{opt}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mt-10 active:scale-95"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Solicitar Consultoria Concierge'}
                  </button>
                  <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sua solicitação é tratada com sigilo bancário e criptografia de dados.</p>
               </form>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomConsultation;
