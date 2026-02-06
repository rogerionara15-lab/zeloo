import React from 'react';

interface BudgetGeneratorProps {
  onBudgetGenerated?: (budget: any) => void; // mantido por compatibilidade (não usado)
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
  userPlan?: string; // mantido por compatibilidade (não usado)
}

const BudgetGenerator: React.FC<BudgetGeneratorProps> = ({ isLoggedIn, onAuthRequired }) => {
  return (
    <section id="orcamento" className="py-24 bg-slate-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">

          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8 shadow-sm">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Atendimento com Profissionais
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
              Avaliação Técnica <br />
              <span className="text-indigo-600">Presencial</span>
            </h2>

            <p className="text-xl text-slate-500 font-medium mb-10 leading-relaxed">
              Aqui a promessa é real: um profissional vai até você, avalia com segurança e define o caminho correto
              para resolver o problema (elétrica, hidráulica ou manutenção).
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-2xl mb-2">🧰</p>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Processo</p>
                <p className="text-xs font-bold text-slate-900">Triagem + Visita Presencial</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-2xl mb-2">🛡️</p>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Segurança</p>
                <p className="text-xs font-bold text-slate-900">Decisão final humana</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onAuthRequired}
                className="w-full sm:w-auto px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 group"
              >
                {isLoggedIn ? 'Abrir Chamado Agora' : 'Acessar Área do Cliente'}
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                * O assistente Zeloo ajuda na triagem. A avaliação técnica final é sempre presencial.
              </p>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="bg-white p-10 rounded-[4rem] border border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="space-y-6">
                <div className="h-4 bg-slate-200 rounded-full w-1/3"></div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    Exemplo de triagem
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    “Meu disjuntor cai quando ligo o chuveiro”
                  </p>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    O Assistente Zeloo sugere: <span className="font-bold">Elétrica</span> · nível de urgência:{' '}
                    <span className="font-bold">médio</span> · recomenda abrir chamado para visita técnica.
                  </p>
                </div>

                <div className="h-14 bg-indigo-600 rounded-2xl w-full flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest">
                  Triar e Encaminhar Chamado
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BudgetGenerator;
