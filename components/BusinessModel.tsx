
import React from 'react';
import { BUSINESS_MODEL } from '../constants';

const BusinessModel: React.FC = () => {
  return (
    <section className="py-24 bg-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Estratégia de Sustentabilidade Zeloo</h2>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
            Como garantimos um serviço de alta qualidade mantendo a rentabilidade e escalabilidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {BUSINESS_MODEL.strategies.map((strat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-4xl mb-4">{strat.icon}</div>
              <h3 className="text-xl font-bold mb-3">{strat.title}</h3>
              <p className="text-indigo-100/70 leading-relaxed text-sm">
                {strat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white text-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                <div>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-indigo-600">📋</span> Política de Agendamento
                    </h3>
                    <p className="text-slate-600 mb-4">{BUSINESS_MODEL.policy.scheduling}</p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-500">
                        *Visitas de emergência são priorizadas automaticamente pelo algoritmo de rota.
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-red-500">🚫</span> O que NÃO está incluso
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {BUSINESS_MODEL.policy.exclusions.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-700 font-medium">
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessModel;
