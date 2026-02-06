
import React, { useState } from 'react';
import { PlanDetails } from '../types';

interface PricingProps {
  onSelectPlan: (plan: PlanDetails) => void;
  plans: PlanDetails[];
  onCondoBudgetClick: () => void;
  onBusinessBudgetClick: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan, plans, onCondoBudgetClick, onBusinessBudgetClick }) => {
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);

  const handleProceed = () => {
    const plan = plans.find(p => p.name === selectedPlanName);
    if (plan) onSelectPlan(plan);
  };

  return (
    <section id="planos" className="py-40 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600 rounded-full blur-[180px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-6">Filiação Zeloo</h2>
          <h3 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-10">Escolha seu <br/><span className="text-indigo-400">Nível de Proteção.</span></h3>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Mais que um serviço, um clube exclusivo de manutenção. <br/>Sem letras miúdas, apenas <span className="text-white font-bold">segurança inabalável.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {plans.map((plan, idx) => {
            const isSelected = selectedPlanName === plan.name;
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedPlanName(plan.name)}
                className={`group relative p-10 rounded-[4rem] border-2 transition-all duration-700 cursor-pointer flex flex-col ${
                  isSelected 
                  ? 'bg-white text-slate-950 border-white scale-[1.05] shadow-[0_40px_100px_-15px_rgba(79,70,229,0.4)] z-10' 
                  : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-2xl">Recomendado</div>
                )}
                
                <div className="mb-10">
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-6 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{plan.tier}</p>
                  <h3 className="text-3xl font-black leading-tight tracking-tight">{plan.name}</h3>
                </div>

                <div className="mb-12">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-14 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-[11px] font-bold uppercase tracking-tight opacity-80">
                      <span className={isSelected ? 'text-indigo-600' : 'text-indigo-400'}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                {plan.save && (
                  <div className={`mb-8 p-4 rounded-2xl text-[9px] font-black uppercase text-center border ${
                    isSelected ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white/5 border-white/10 text-indigo-400'
                  }`}>
                    {plan.save}
                  </div>
                )}

                <div className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all ${
                  isSelected ? 'bg-slate-950 text-white shadow-xl' : 'bg-white/10 text-white group-hover:bg-white/20'
                }`}>
                  {isSelected ? 'Plano Ativo' : 'Selecionar'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-12">
          <button 
            onClick={handleProceed}
            disabled={!selectedPlanName}
            className={`px-24 py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.3em] transition-all ${
              selectedPlanName 
              ? 'bg-indigo-500 text-white shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95' 
              : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
            }`}
          >
            Confirmar Assinatura
          </button>
          
          <div className="flex flex-col sm:flex-row gap-12 text-slate-500">
             <button onClick={onCondoBudgetClick} className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Portfólio Condomínios →</button>
             <button onClick={onBusinessBudgetClick} className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">Zeloo Business Pro →</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
