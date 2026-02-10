import React, { useMemo, useState } from "react";
import { PlanDetails, AdminProfile } from "../types";

interface CheckoutProps {
  plan: PlanDetails;
  adminConfig: AdminProfile;
  onCancel: () => void;
  onSuccess: (data: any) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ plan, adminConfig, onCancel, onSuccess }) => {
  const [step, setStep] = useState<"DETAILS" | "PAYMENT">("DETAILS");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    email: "",
  });

  const contractValue = useMemo(() => {
    const price = parseInt(plan.price.replace(/\D/g, ""));
    if (plan.tier.includes("Trimestral")) return price * 3;
    if (plan.tier.includes("Semestral")) return price * 6;
    if (plan.tier.includes("Anual")) return price * 12;
    return price;
  }, [plan]);

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("PAYMENT");
  };

  const handleProcess = async () => {
    setLoading(true);

    try {
      // Fluxo "paga primeiro -> cria login depois": NÃO existe sessão aqui.
      const email = (formData.email || "").trim().toLowerCase();

      if (!email || !email.includes("@")) {
        alert("Informe um e-mail válido para continuar.");
        return;
      }

      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Zeloo Premium - ${plan.name}`,
          price: Number(contractValue),
          quantity: 1,
          email, // vai virar external_reference no backend
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Erro no /api/checkout:", errorText);
        alert("Falha ao iniciar pagamento no Mercado Pago. Tente novamente.");
        return;
      }

      const json = await resp.json();

      if (!json?.ok || !json?.init_point) {
        console.error("Checkout error:", json);
        alert(json?.error || "Falha ao iniciar pagamento no Mercado Pago.");
        return;
      }

      // Checkout Pro: redireciona pro Mercado Pago (PIX/QR/Cartão aparecem lá)
      window.location.href = json.init_point;
    } catch (err: any) {
      console.error("Erro inesperado no checkout:", err);
      alert(err?.message || "Falha ao iniciar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-20 animate-in fade-in">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {step === "DETAILS" ? "1. Identificação" : "2. Pagamento"}
            </h2>
            <button
              onClick={onCancel}
              className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500"
            >
              Cancelar
            </button>
          </div>

          {step === "DETAILS" && (
            <form onSubmit={handleGoToPayment} className="space-y-5">
              <input
                required
                placeholder="Nome Completo"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder="CPF"
                  name="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                />
                <input
                  required
                  placeholder="E-mail"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                />
              </div>

              <input
                required
                placeholder="Endereço"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none"
              />

              <button
                type="submit"
                className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
              >
                Próximo Passo
              </button>
            </form>
          )}

          {step === "PAYMENT" && (
            <div className="space-y-8">
              <div className="bg-slate-100 p-6 rounded-2xl">
                <p className="text-[11px] font-black uppercase text-slate-600">
                  Você será redirecionado para o Mercado Pago para pagar com PIX ou Cartão.
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">
                  Após o pagamento aprovado, a Zeloo libera seu acesso automaticamente.
                </p>
              </div>

              <button
                onClick={handleProcess}
                disabled={loading}
                className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-2xl flex items-center justify-center gap-3"
              >
                {loading
                  ? "Abrindo Mercado Pago..."
                  : `Pagar R$ ${contractValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">
              Você escolheu:
            </p>
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
              <span className="text-3xl font-black">
                R$ {contractValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
