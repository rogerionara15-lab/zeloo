import React from 'react';

const FormasPagamento: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={onBack}
          className="mb-6 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
        >
          ← Voltar
        </button>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Formas de pagamento</h1>

          <p className="mt-4 text-sm text-slate-600 font-semibold leading-relaxed">
            Hoje a Zeloo trabalha com pagamentos via Mercado Pago (Pix). As opções abaixo entram na próxima etapa.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pix</p>
              <p className="mt-2 text-lg font-black text-emerald-600">Disponível</p>
              <p className="mt-2 text-sm text-slate-600 font-semibold">Aprovação rápida e liberação automática.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cartão</p>
              <p className="mt-2 text-lg font-black text-slate-400">Em breve</p>
              <p className="mt-2 text-sm text-slate-600 font-semibold">Crédito e débito (Mercado Pago).</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Boleto</p>
              <p className="mt-2 text-lg font-black text-slate-400">Em breve</p>
              <p className="mt-2 text-sm text-slate-600 font-semibold">Liberação após compensação.</p>
            </div>
          </div>

          <div className="mt-10 flex gap-3 flex-wrap">
            <button
              onClick={onBack}
              className="px-8 py-4 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormasPagamento;
