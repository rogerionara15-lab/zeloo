
import React from 'react';
import { BrandingInfo } from '../types';

interface HeroProps {
  onConsultPlans: () => void;
  onOpenLogin: () => void;
  onOpenAssistant: () => void;
  branding: BrandingInfo;
}

const Hero: React.FC<HeroProps> = ({ onConsultPlans, onOpenAssistant, branding }) => {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden bg-white">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[120px] opacity-40"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-3 py-2.5 px-6 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-[9px] font-black uppercase tracking-[0.3em] mb-12 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
              O Futuro da Manutenção Chegou
            </div>
            
            <h1 className="text-7xl md:text-[110px] font-black text-slate-950 mb-10 leading-[0.85] tracking-tighter">
              {branding.slogan.split(',').map((part, i) => (
                <span key={i} className={`block ${i === 1 ? 'text-indigo-600' : ''}`}>
                  {part.trim()}{i === 0 ? ',' : ''}
                </span>
              ))}
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mb-14 leading-relaxed font-medium">
              Esqueça a busca por profissionais. A Zeloo é a <span className="text-slate-950 font-black"> sua melhor opçao</span> que protege seu lar através de inteligência preditiva e técnicos certificados.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <button 
                onClick={onConsultPlans}
                className="w-full sm:w-auto px-14 py-7 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-indigo-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group"
              >
                Ativar Proteção Zeloo
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button 
                onClick={onOpenAssistant}
                className="w-full sm:w-auto px-14 py-7 bg-white text-slate-900 border-2 border-slate-200 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:border-slate-950 transition-all flex items-center justify-center gap-3"
              >
                Diagnóstico IA
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:block relative">
            <div className="animate-float relative">
              <div className="bg-slate-950 p-10 rounded-[4rem] text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-2xl">🤖</div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-indigo-400">Status da Casa</p>
                    <p className="text-sm font-bold">100% Protegida</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[95%]"></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Próxima manutenção preventiva agendada para: <br/><span className="text-white font-bold">12 de Outubro</span></p>
                </div>
              </div>

              {/* Card flutuante secundário */}
              <div className="absolute -bottom-10 -left-20 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 max-w-[220px] animate-pulse">
                <p className="text-2xl mb-2">⚡</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Resposta Rápida</p>
                <p className="text-xs font-bold text-slate-900">Emergências atendidas em média em 54 min.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
