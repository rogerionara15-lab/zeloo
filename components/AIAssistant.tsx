
import React from 'react';

interface AIAssistantProps {
  onOpenCounselor: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onOpenCounselor }) => {
  return (
    <section id="conselheiro" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="currentColor">
          <path d="M0 100 C 20 0 50 0 100 100 Z" />
        </svg>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-indigo-500/20">🤖</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Conselheiro Inteligente Zeloo</h2>
          <p className="text-slate-400 text-lg">
            Diagnóstico instantâneo e orientações técnicas para qualquer problema em sua casa.
          </p>
        </div>

        <div className="bg-slate-800 p-8 md:p-16 rounded-[4rem] border border-slate-700 shadow-2xl text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           
           <h3 className="text-2xl font-black mb-6 relative z-10">Resolva dúvidas técnicas agora</h3>
           <p className="text-slate-400 font-medium mb-12 max-w-md mx-auto relative z-10">
             Nossa IA de engenharia processa seu relato e oferece soluções imediatas baseadas em padrões técnicos de segurança.
           </p>

           <div className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-10">
              <button 
                onClick={onOpenCounselor}
                className="w-full sm:w-auto px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-900/40 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
              >
                Acessar Portal de Diagnóstico
              </button>
              <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                 <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                 Suporte IA Ativo
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistant;
