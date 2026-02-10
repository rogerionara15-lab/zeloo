import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

type PosPagamentoProps = {
  onBack: () => void;
  onApproved: (email: string) => void;
};

const PosPagamento: React.FC<PosPagamentoProps> = ({ onBack, onApproved }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "CHECKING" | "APPROVED" | "PENDING" | "ERROR">("IDLE");
  const [loading, setLoading] = useState(false);

  const checkPaid = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Digite o e-mail usado no pagamento.");
      return;
    }

    setStatus("CHECKING");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("paid_access")
        .select("status")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (error) throw error;

      if (data?.status === "APPROVED") {
        setStatus("APPROVED");
      } else {
        setStatus("PENDING");
      }
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
    } finally {
      setLoading(false);
    }
  };

  // ✅ fica verificando automaticamente quando status estiver pending/checking
  useEffect(() => {
    if (status !== "PENDING" && status !== "CHECKING") return;

    const interval = setInterval(() => {
      checkPaid();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Confirmar pagamento</h1>
          <button
            onClick={onBack}
            className="text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600"
          >
            Voltar
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Como o PIX às vezes não volta sozinho para o site, confirme aqui com o e-mail usado no pagamento.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-600 uppercase">E-mail usado no pagamento</label>
          <input
            type="email"
            placeholder="ex: seuemail@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
          />
        </div>

        {status === "CHECKING" && (
          <p className="text-sm font-bold">Verificando pagamento…</p>
        )}

        {status === "PENDING" && (
          <p className="text-sm font-bold text-amber-600">
            Ainda aguardando confirmação. Se você acabou de pagar, aguarde alguns segundos.
          </p>
        )}

        {status === "ERROR" && (
          <p className="text-sm font-bold text-red-600">
            Não foi possível verificar agora. Tente novamente.
          </p>
        )}

        {status === "APPROVED" && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-green-600">Pagamento confirmado ✅</p>

            <button
              onClick={() => onApproved(email.trim().toLowerCase())}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase"
            >
              Criar login e senha
            </button>
          </div>
        )}

        <button
          onClick={checkPaid}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase"
        >
          {loading ? "Verificando..." : "Verificar pagamento"}
        </button>
      </div>
    </div>
  );
};

export default PosPagamento;
