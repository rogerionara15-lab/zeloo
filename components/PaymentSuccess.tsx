import React from 'react';

interface PaymentSuccessProps {
  planName: string;
  paymentStatus?: 'PAID' | 'AWAITING_APPROVAL';
  onContinue: () => void;

  // ✅ NOVO: botão para confirmar pagamento PIX
  onConfirmPayment: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  planName,
  paymentStatus,
  onContinue,
  onConfirmPayment,
}) => {
  const isAwaiting = paymentStatus === 'AWAITING_APPROVAL';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-20 animate-in fade-in duration-700">
      <div className="max-w-2xl w-full bg-white rounded-[4rem] p-12 md:p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden text-center">

        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-9xl">💎</div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl animate-bounce ${isAwaiting ? 'bg-amber-500' : 'bg-emerald-500'} text-white`}>
            {isAwaiting ? '⏳' : '✓'}
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border ${isAwaiting ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {isAwaiting ? 'Confirmação Bancária Requerida' : 'Pagamento Confirmado'}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tighter">
            {isAwaiting ? (
              <>Solicitação Registrada <br /><span className="text-amber-500">com Segurança.</span></>
            ) : (
              <>Sua casa agora tem um <br /><span className="text-indigo-600">anjo da guarda digital.</span></>
            )}
          </h1>

          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-lg mx-auto">
            {isAwaiting ? (
              <>Recebemos seu sinal de pagamento via PIX/Boleto. Agora, crie suas credenciais de acesso para que possamos validar seu comprovante e liberar seu plano <span className="text-slate-900 font-black">{planName}</span>.</>
            ) : (
              <>Bem-vindo à família Zeloo. Você acaba de garantir a tranquilidade do seu lar com o plano <span className="text-slate-900 font-black">{planName}</span>.</>
            )}
          </p>

          {/* ✅ NOVO BLOCO: explicação do PIX + botão de confirmar */}
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-10 text-left space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PIX: passo extra</p>
            <p className="text-sm font-bold text-slate-700">
              Se você pagou via PIX e ficou preso na tela do QR Code, isso é normal.
            </p>
            <p className="text-xs text-slate-600">
              Clique em <span className="font-black">“Já paguei (PIX)”</span> para confirmar automaticamente e liberar a criação do seu login.
            </p>
            <button
              onClick={onConfirmPayment}
              className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:opacity-95 active:scale-95 transition-all"
            >
              Já paguei (PIX) • Confirmar pagamento
            </button>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Passo de Segurança 2/3</p>
              <p className="text-sm font-bold text-slate-700">Configuração de Credenciais de Acesso</p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            {isAwaiting ? 'Configurar Credenciais de Segurança' : 'Acessar Meu Painel Zeloo'}
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <p className="mt-8 text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
            Ambiente Criptografado • Zeloo Secure Protocol
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
