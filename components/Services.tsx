
import React from 'react';
import { SERVICES } from '../constants';
import { Service } from '../types';

interface ServicesProps {
  onConsultCustomized?: () => void;
  onServiceClick?: (service: Service) => void;
}

const Services: React.FC<ServicesProps> = ({ onConsultCustomized, onServiceClick }) => {
  return (
    <section id="servicos" className="py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-xl">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">Especialidades</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">Cuidado <br/>Especializado.</h3>
          </div>
          <p className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed">
            Nossa equipe própria domina cada pilar da infraestrutura residencial para você nunca mais se preocupar.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service) => (
            <div 
              key={service.id} 
              onClick={() => onServiceClick?.(service)}
              className="group relative p-10 bg-white rounded-[3rem] border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 group-hover:scale-110 transition-transform duration-700">
                {service.icon}
              </div>
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                {service.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{service.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {service.description}
              </p>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Agendar Especialista <span>→</span>
              </div>
            </div>
          ))}
          
          <div className="p-10 bg-indigo-600 rounded-[3rem] text-white flex flex-col justify-center items-center text-center shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-3xl font-black mb-6 relative z-10">Projetos <br/>Custom?</h3>
            <p className="mb-10 text-indigo-100 font-medium text-sm relative z-10 leading-relaxed">Assinantes Prime recebem 15% de bonificação em reformas e obras civis.</p>
            <button 
              onClick={onConsultCustomized}
              className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all relative z-10 shadow-xl"
            >
              Consultar Zeloo Black
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
