
import React from 'react';

interface TermsOfUseProps {
  onBack: () => void;
  onPrivacyClick: () => void;
}

const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack, onPrivacyClick }) => {
  return (
    <div className="pt-32 pb-24 bg-white animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de Página */}
        <div className="mb-16">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-8"
          >
            <span>←</span> Voltar para o Início
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Termos de Uso</h1>
          <p className="text-slate-500 font-medium italic">Ao utilizar a Zeloo, você concorda com os termos abaixo descritos.</p>
        </div>

        {/* Conteúdo dos Termos */}
        <div className="space-y-16">
          
          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">01</span>
              Objeto dos Serviços
            </h2>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <p className="text-slate-600 leading-relaxed font-medium mb-4">
                A Zeloo presta serviços de manutenção residencial preventiva e corretiva através de planos de assinatura. Nossos serviços incluem, mas não se limitam a: reparos elétricos, hidráulicos, check-ups preventivos e limpeza de reservatórios.
              </p>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs font-bold text-amber-700">
                <span>⚠️</span>
                <p>Nossos planos cobrem apenas a mão de obra especializada. Materiais e peças de reposição são de responsabilidade do cliente ou orçados separadamente.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">02</span>
              Assinatura e Pagamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 border border-slate-200 rounded-3xl">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <span className="text-emerald-500">🔄</span> Renovação
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">As assinaturas são renovadas automaticamente ao final de cada período (mensal, trimestral, semestral ou anual) através do método de pagamento cadastrado.</p>
              </div>
              <div className="p-8 border border-slate-200 rounded-3xl">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <span className="text-indigo-600">💳</span> Cobrança
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">Utilizamos o Mercado Pago para processamento seguro. A Zeloo não tem acesso direto aos dados do seu cartão de crédito.</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
             <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="text-indigo-400 text-3xl">📅</span> Regras de Agendamento
             </h2>
             <div className="space-y-6">
                {[
                  "As visitas devem ser agendadas via app ou portal com antecedência mínima de 48 horas.",
                  "Emergências (vazamentos graves, curto-circuito total) são priorizadas e atendidas conforme a disponibilidade do plano.",
                  "Em caso de ausência do cliente na data marcada, será cobrada uma taxa de deslocamento para reagendamento.",
                  "Nossos técnicos portarão identificação Zeloo e uniforme completo para sua segurança."
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                    <p className="text-indigo-100 font-medium leading-relaxed">{item}</p>
                  </div>
                ))}
             </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">03</span>
              Cancelamento e Reembolso
            </h2>
            <div className="space-y-4">
               <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-600 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">🛑</span>
                    <div>
                       <p className="font-bold text-slate-900">Cancelamento de Plano Mensal</p>
                       <p className="text-xs text-slate-500">Pode ser solicitado a qualquer momento, encerrando o acesso ao final do mês vigente.</p>
                    </div>
                  </div>
               </div>
               <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-600 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">📊</span>
                    <div>
                       <p className="font-bold text-slate-900">Planos Anuais/Semestrais</p>
                       <p className="text-xs text-slate-500">Cancelamento antecipado pode estar sujeito a multa de 10% sobre o saldo remanescente.</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-indigo-50 p-10 rounded-[3rem] border border-indigo-100">
             <h2 className="text-2xl font-black text-slate-900 mb-6">Exclusões de Responsabilidade</h2>
             <p className="text-slate-600 mb-8 leading-relaxed">
               A Zeloo não se responsabiliza por danos estruturais pré-existentes no imóvel, problemas decorrentes de mau uso por parte do cliente ou intervenções realizadas por terceiros não autorizados após a nossa visita técnica.
             </p>
             <button 
                onClick={onPrivacyClick}
                className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all"
             >
               Ver Política de Privacidade completa <span>→</span>
             </button>
          </section>

          <section className="text-center py-12">
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Ficou alguma dúvida?</p>
             <a href="mailto:juridico@zeloo.com" className="inline-block px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Contatar Jurídico</a>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
