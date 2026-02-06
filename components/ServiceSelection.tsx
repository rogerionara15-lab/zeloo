
import React from 'react';
import { Service } from '../types';

interface ServiceSelectionProps {
  service: Service;
  onBack: () => void;
  onSelectSubService: (subService: string) => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ service, onBack, onSelectSubService }) => {
  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-12"
        >
          <span>←</span> Voltar para serviços
        </button>

        <div className="bg-white rounded-[4rem] p-10 md:p-16 shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none text-9xl">
            {service.icon}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">
                {service.icon}
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{service.title}</h1>
                <p className="text-slate-500 font-medium">{service.description}</p>
              </div>
            </div>

            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 ml-2">Qual o problema exato?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.subServices?.map((sub, idx) => (
                <button 
                  key={idx}
                  onClick={() => onSelectSubService(sub)}
                  className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-600 hover:shadow-xl transition-all text-left"
                >
                  <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{sub}</span>
                  <span className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">→</span>
                </button>
              ))}

              <button 
                onClick={() => onSelectSubService(`Outro em ${service.title}`)}
                className="group flex items-center justify-between p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-xl transition-all text-left"
              >
                <div className="flex items-center gap-4">
                   <span className="text-xl">✨</span>
                   <span className="font-bold text-indigo-900 group-hover:text-white transition-colors">Não encontrei meu problema</span>
                </div>
                <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 transition-all">?</span>
              </button>
            </div>

            <div className="mt-16 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0">🛡️</div>
                  <p className="text-sm text-amber-900 font-medium leading-relaxed">
                    <strong>Garantia Zeloo:</strong> Todos os reparos de {service.title.toLowerCase()} possuem 90 dias de garantia total sobre a mão de obra.
                  </p>
               </div>
               <button 
                 onClick={onBack}
                 className="whitespace-nowrap px-8 py-4 bg-amber-200 text-amber-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-300 transition-all"
               >
                 Tirar Dúvida Técnica
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;
