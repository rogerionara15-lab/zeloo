import React from 'react';

const ADMIN_WHATSAPP = '5543996000274';

const Cancelamento: React.FC<{ onBack: () => void; userName?: string; userEmail?: string }> = ({
  onBack,
  userName,
  userEmail,
}) => {
  const msg =
    `Olá! Gostaria de solicitar cancelamento do meu plano Zeloo.\n\n` +
    `Nome: ${userName || '—'}\n` +
    `Email: ${userEmail || '—'}\n\n` +
    `Motivo (opcional):`;

  const wa = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;

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
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Solicitar cancelamento</h1>

          <p className="mt-4 text-sm text-slate-600 font-semibold leading-relaxed">
            Para garantir segurança e evitar cancelamentos indevidos, o cancelamento é solicitado pelo WhatsApp.
            Nossa equipe confirma seus dados e finaliza o processo.
          </p>

          <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">O que acontece depois?</p>
            <ul className="mt-3 text-sm text-slate-700 font-semibold list-disc pl-5 space-y-2">
              <li>Confirmamos o titular e o plano</li>
              <li>Registramos a data do cancelamento</li>
              <li>Enviamos confirmação por mensagem</li>
            </ul>
          </div>

          <div className="mt-10 flex gap-3 flex-wrap">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              Abrir WhatsApp e solicitar
            </a>

            <button
              onClick={onBack}
              className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cancelamento;
