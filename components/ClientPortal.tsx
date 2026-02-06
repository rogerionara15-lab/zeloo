
import React from 'react';

interface ClientPortalProps {
  onBack: () => void;
  onLoginClick: () => void;
  onPlanClick: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ onBack, onLoginClick, onPlanClick }) => {
  return (
    <div className="pt-32 pb-24 bg-white animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de Página */}
        <div className="mb-20">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-8"
          >
            <span>←</span> Voltar para o Início
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6">Sua casa na palma da mão.</h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10">
                A Área do Cliente Zeloo é o portal central onde você gerencia cada detalhe da sua assinatura e a saúde do seu lar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onLoginClick}
                  className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Acessar Minha Conta
                </button>
                <button 
                  onClick={onPlanClick}
                  className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Não sou cliente
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                  <span className="text-9xl text-white">📱</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">Z</div>
                    <span className="text-white font-black uppercase tracking-widest text-sm">Zeloo App Preview</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="h-20 bg-indigo-600/50 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2">
                        <span className="text-xl">🛠️</span>
                        <span className="text-[10px] text-white/70 font-black uppercase tracking-widest">Reparos</span>
                      </div>
                      <div className="h-20 bg-white/10 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2">
                        <span className="text-xl">📊</span>
                        <span className="text-[10px] text-white/70 font-black uppercase tracking-widest">Saúde</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recursos do Portal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {[
            { title: 'Chamados 24h', desc: 'Abra solicitações de reparo a qualquer momento direto pelo portal.', icon: '🔧' },
            { title: 'Histórico Completo', desc: 'Acesse todos os relatórios de visitas e manutenções anteriores.', icon: '📋' },
            { title: 'Check-up IA', desc: 'Receba alertas preventivos sobre a saúde da sua rede elétrica e hidráulica.', icon: '🧠' },
            { title: 'Gestão Financeira', desc: 'Gerencie sua assinatura, métodos de pagamento e faturas.', icon: '💳' },
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all">
              <div className="text-4xl mb-6">{feature.icon}</div>
              <h3 className="text-lg font-black text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Seção Exclusiva */}
        <div className="bg-indigo-900 rounded-[4rem] p-12 md:p-24 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
             <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
           </div>
           
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div>
               <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Vantagens de ser um Assinante Zeloo</h2>
               <div className="space-y-6">
                 {[
                   'Prioridade máxima no agendamento de chamados.',
                   'Acesso exclusivo a especialistas via chat em tempo real.',
                   'Descontos progressivos em materiais de reposição.',
                   'Seguro residencial incluso nos planos Prime e Infinity.'
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4">
                     <span className="w-6 h-6 bg-emerald-500 text-slate-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">✓</span>
                     <p className="text-indigo-100 font-bold">{item}</p>
                   </div>
                 ))}
               </div>
             </div>
             <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10">
               <h3 className="text-xl font-black mb-6">Já é cliente?</h3>
               <p className="text-indigo-200 mb-8">Utilize seu login para entrar agora e gerenciar sua residência.</p>
               <button 
                 onClick={onLoginClick}
                 className="w-full py-5 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all"
               >
                 Entrar no Portal
               </button>
             </div>
           </div>
        </div>

        {/* Footer de Suporte */}
        <div className="mt-24 text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6">Problemas com o acesso?</p>
          <div className="flex justify-center gap-6">
            <a href="mailto:suporte@zeloo.com" className="text-slate-900 font-bold hover:text-indigo-600 transition-colors">suporte@zeloo.com</a>
            <span className="text-slate-200">|</span>
            <a href="#" className="text-slate-900 font-bold hover:text-indigo-600 transition-colors">(11) 99999-9999</a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClientPortal;
