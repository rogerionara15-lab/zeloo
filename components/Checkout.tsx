
import React, { useState, useMemo } from 'react';
import { PlanDetails, AdminProfile } from '../types';
import paymentService, { PaymentRequest } from '../services/paymentService';

interface CheckoutProps {
  plan: PlanDetails;
  adminConfig: AdminProfile;
  onCancel: () => void;
  onSuccess: (data: any) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ plan, adminConfig, onCancel, onSuccess }) => {
  const [step, setStep] = useState<'DETAILS' | 'PAYMENT' | 'PIX_DISPLAY'>('DETAILS');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [pixInfo, setPixInfo] = useState<{payload: string, qrcode: string, txId: string} | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', cpf: '', cep: '', address: '', number: '', complement: '', email: ''
  });

  const contractValue = useMemo(() => {
    const price = parseInt(plan.price.replace(/\D/g, ''));
    if (plan.tier.includes('Trimestral')) return price * 3;
    if (plan.tier.includes('Semestral')) return price * 6;
    if (plan.tier.includes('Anual')) return price * 12;
    return price;
  }, [plan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await paymentService.process({
        method: paymentMethod,
        amount: contractValue,
        customer: {
          name: formData.name,
          email: formData.email,
          document: formData.cpf,
          address: `${formData.address}, ${formData.number}`
        }
      });

      if (paymentMethod === 'PIX' && resp.pixPayload) {
        setPixInfo({ payload: resp.pixPayload, qrcode: resp.pixQrCode!, txId: resp.transactionId });
        setStep('PIX_DISPLAY');
      } else if (resp.status === 'PAID') {
        onSuccess({ ...formData, paymentStatus: 'PAID', planName: plan.name });
      }
    } catch (err) {
      alert('Falha na comunicação com o Gateway.');
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixInfo) {
      navigator.clipboard.writeText(pixInfo.payload);
      alert('Código PIX copiado!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-20 animate-in fade-in">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {step === 'DETAILS' ? '1. Identificação' : step === 'PAYMENT' ? '2. Pagamento' : '3. Finalizar PIX'}
            </h2>
            <button onClick={onCancel} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500">Cancelar</button>
          </div>

          {step === 'DETAILS' && (
            <form onSubmit={() => setStep('PAYMENT')} className="space-y-5">
              <input required placeholder="Nome Completo" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="CPF" name="cpf" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                <input required placeholder="E-mail" type="email" name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
              </div>
              <input required placeholder="Endereço" name="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Próximo Passo</button>
            </form>
          )}

          {step === 'PAYMENT' && (
            <div className="space-y-8">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button onClick={() => setPaymentMethod('PIX')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMethod === 'PIX' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>PIX</button>
                <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMethod === 'CARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Cartão</button>
              </div>

              {paymentMethod === 'CARD' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                  <input placeholder="Número do Cartão" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Validade (MM/AA)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold" />
                    <input placeholder="CVV" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold" />
                  </div>
                </div>
              )}

              <button onClick={handleProcess} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3">
                {loading ? 'Processando...' : `Confirmar R$ ${contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </button>
            </div>
          )}

          {step === 'PIX_DISPLAY' && pixInfo && (
            <div className="text-center space-y-8 animate-in zoom-in-95">
              <div className="bg-indigo-50 p-6 rounded-[3rem] inline-block border-2 border-indigo-100 pix-pulse">
                <img src={pixInfo.qrcode} className="w-52 h-52 rounded-2xl" alt="PIX" />
              </div>
              <div className="space-y-4 text-left">
                <button onClick={copyPix} className="w-full py-4 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2">📋 Copiar Código PIX</button>
                <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-dashed border-amber-200">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-4 tracking-widest text-center">Anexe o comprovante para liberação</p>
                  
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 rounded-2xl cursor-pointer bg-white hover:bg-amber-100/50 transition-all mb-4 overflow-hidden">
                    {proofBase64 ? (
                      <img src={proofBase64} className="h-full w-full object-cover" alt="Proof" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[9px] font-black uppercase text-amber-500">Selecionar Comprovante</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <button 
                    onClick={() => onSuccess({...formData, paymentStatus: 'AWAITING_APPROVAL', planName: plan.name, paymentProofUrl: proofBase64})} 
                    disabled={!proofBase64} 
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg disabled:opacity-30"
                  >
                    Finalizar Assinatura
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Você escolheu:</p>
            <h3 className="text-2xl font-black mb-6">{plan.name}</h3>
            <ul className="space-y-3 mb-10">
              {plan.features.slice(0, 4).map((f, i) => (
                <li key={i} className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase">
                  <span className="text-indigo-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
              <span className="text-[10px] font-black text-indigo-400 uppercase">Valor do Contrato</span>
              <span className="text-3xl font-black">R$ {contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
