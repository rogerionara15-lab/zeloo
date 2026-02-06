
import React, { useState, useEffect, useRef } from 'react';
import { MOBILE_APP_VISION } from '../constants';
import { UserRole } from '../types';

interface MobileAppVisionProps {
  onOpenDashboard: () => void;
  onOpenDiagnosis: () => void;
}

const MobileAppVision: React.FC<MobileAppVisionProps> = ({ onOpenDashboard, onOpenDiagnosis }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedScreen, setSelectedScreen] = useState(MOBILE_APP_VISION.find(s => s.role === UserRole.CLIENT) || MOBILE_APP_VISION[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      const clampedProgress = Math.min(Math.max(progress, 0), 1);
      setScrollProgress(clampedProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clientScreens = MOBILE_APP_VISION.filter(s => s.role === UserRole.CLIENT);

  const translateY = (scrollProgress - 0.5) * -60;
  const rotateX = (scrollProgress - 0.5) * 10;
  const rotateY = (scrollProgress - 0.5) * -5;
  const internalTranslateY = (scrollProgress - 0.5) * 20;

  const handleScreenChange = (screen: typeof selectedScreen) => {
    if (screen.id === selectedScreen.id) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedScreen(screen);
      setIsTransitioning(false);
    }, 300);
  };

  const handleCtaClick = () => {
    if (selectedScreen.id === 'c1') {
      onOpenDashboard();
    } else if (selectedScreen.id === 'c2') {
      onOpenDiagnosis();
    }
  };

  const handleAgendamentoSolicitado = () => {
    console.log('Agendamento solicitado');
  };

  return (
    <section ref={sectionRef} className="py-32 bg-slate-50 border-t border-slate-200 perspective-1000 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          
          <div 
            className="relative shrink-0 transition-transform duration-500 ease-out will-change-transform"
            style={{ 
              transform: `translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              perspective: '1200px'
            }}
          >
            {/* Sombra Dinâmica */}
            <div className="absolute -inset-4 bg-indigo-600/10 rounded-[5rem] blur-3xl -z-10 animate-pulse"></div>

            <div className="w-[320px] h-[720px] bg-slate-900 rounded-[4rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-[12px] border-slate-800 relative overflow-hidden z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-800 rounded-b-3xl z-20"></div>
              
              <div className="h-full w-full bg-white rounded-[3rem] overflow-hidden flex flex-col relative">
                <div 
                  className={`flex-grow p-8 flex flex-col transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
                  style={{ transform: `translateY(${internalTranslateY}px)` }}
                >
                  <div className="h-6 flex justify-between px-2 pt-1 items-center text-[10px] font-bold text-slate-300 mb-8">
                    <span>9:41</span>
                    <div className="flex gap-1.5"><span>📶</span><span>🔋</span></div>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl shadow-indigo-100 animate-in zoom-in-50 duration-500">Z</div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">👤</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-3xl font-black text-slate-900 mb-2 leading-tight tracking-tighter">{selectedScreen.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">{selectedScreen.description}</p>
                    
                    <div className="space-y-3">
                      {selectedScreen.features.map((feature, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-[1.2rem] border border-slate-100 text-[9px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-4 shadow-sm transform transition-all duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span> {feature}
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={handleAgendamentoSolicitado}
                      className="mt-6 w-full py-5 bg-slate-950 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3 group border border-white/10"
                    >
                      Solicitar Agendamento
                      <span className="text-sm group-hover:translate-y-[-2px] transition-transform">📅</span>
                    </button>

                    <button 
                      onClick={handleCtaClick}
                      className="mt-4 w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                    >
                      Acessar Agora
                      <span className="text-xl group-hover:translate-x-1 transition-transform">➜</span>
                    </button>
                  </div>
                </div>

                <div className="h-20 bg-slate-50 border-t border-slate-100 flex justify-around items-center px-8 mt-auto">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 opacity-50"></div>
                  <div className="w-6 h-6 rounded-lg bg-slate-200 opacity-50"></div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 shadow-2xl shadow-indigo-200 flex items-center justify-center text-white text-xl font-bold transition-transform hover:scale-110 active:scale-90">+</div>
                  <div className="w-6 h-6 rounded-lg bg-slate-200 opacity-50"></div>
                  <div className="w-6 h-6 rounded-lg bg-slate-200 opacity-50"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute -z-10 -bottom-20 -left-20 w-80 h-80 bg-indigo-200 rounded-full blur-[120px] opacity-40"></div>
            <div className="absolute -z-10 -top-20 -right-20 w-80 h-80 bg-emerald-100 rounded-full blur-[120px] opacity-40"></div>
          </div>

          <div className="flex-grow max-w-xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-10 shadow-sm">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Interface 4.0
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-10 tracking-tighter leading-[0.95]">
              Controle absoluto <br/><span className="text-indigo-600">em suas mãos.</span>
            </h2>
            <p className="text-slate-500 text-xl mb-12 leading-relaxed font-medium">
              Escolha uma interface ao lado e veja como a tecnologia Zeloo transforma a complexidade técnica em um fluxo intuitivo e seguro.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {clientScreens.map((screen) => (
                <button 
                  key={screen.id}
                  onClick={() => handleScreenChange(screen)}
                  className={`text-left p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${selectedScreen.id === screen.id ? 'border-indigo-600 bg-white shadow-2xl scale-[1.05] z-10 ring-8 ring-indigo-50' : 'border-slate-100 bg-transparent hover:border-slate-200 hover:scale-[1.02]'}`}
                >
                  <h4 className="font-black text-slate-900 mb-3 uppercase text-[12px] tracking-widest leading-none">{screen.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{screen.description}</p>
                </button>
              ))}
            </div>

            <div className="p-10 bg-slate-950 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <span className="text-8xl">🔒</span>
               </div>
               <h3 className="font-black text-white text-xl mb-4 uppercase tracking-tight">Ambiente Certificado</h3>
               <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  Toda a comunicação entre o app e nossa central de engenharia é protegida por criptografia de nível bancário e conformidade total com a LGPD.
               </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppVision;
