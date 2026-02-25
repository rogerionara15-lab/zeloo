import React, { useMemo, useState } from 'react';

interface ContactConsultantProps {
  onBack: () => void;
}

const ContactConsultant: React.FC<ContactConsultantProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Dúvida sobre Planos');
  const [message, setMessage] = useState('');

  // ✅ WhatsApp oficial Zeloo
  const whatsappNumber = useMemo(() => '5542988670973', []);

  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const openWhatsApp = (text: string) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noreferrer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const text = [
      'Olá! Quero falar com a Zeloo.',
      '',
      `Nome: ${name}`,
      `Telefone: ${phone}`,
      `Assunto: ${subject}`,
      '',
      `Mensagem: ${message}`,
    ].join('\n');

    // ✅ Envia via WhatsApp (sem backend)
    openWhatsApp(text);

    // ✅ Feedback visual
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 400);
  };

  const whatsappCtaText = useMemo(
    () => 'Olá! Quero saber mais sobre os planos da Zeloo.',
    []
  );

  return (
    <div className="pt-32 pb-24 bg-white animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de Página */}
        <div className="mb-20 text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-8"
          >
            <span>←</span> Voltar para o Início
          </button>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
            Consultoria Zeloo
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">
            Não somos apenas um serviço, somos seus parceiros na gestão do seu lar. Escolha
            como quer falar com a gente.
          </p>
        </div>

        {/* Canais de Atendimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <button
            onClick={() => openWhatsApp(whatsappCtaText)}
            className="group p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100 transition-all text-center cursor-pointer outline-none"
          >
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-emerald-200 group-hover:scale-110 transition-transform">
              📱
            </div>
            <h3 className="text-xl font-black text-emerald-900 mb-2">WhatsApp</h3>
            <p className="text-emerald-700/70 text-sm font-medium mb-6">
              Atendimento imediato para dúvidas rápidas e orçamentos.
            </p>
            <span className="text-emerald-600 font-black text-xs uppercase tracking-widest">
              Abrir conversa →
            </span>
          </button>

          <button
            onClick={scrollToForm}
            className="group p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-center cursor-pointer outline-none"
          >
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
              📅
            </div>
            <h3 className="text-xl font-black text-indigo-900 mb-2">Agendar Call</h3>
            <p className="text-indigo-700/70 text-sm font-medium mb-6">
              Marque uma reunião de 15 min para entender nossos planos.
            </p>
            <span className="text-indigo-600 font-black text-xs uppercase tracking-widest">
              Ir para o formulário →
            </span>
          </button>

          <a
            href="mailto:zelooservicos@gmail.com?subject=Proposta%20Zeloo%20(B2B)&body=Ol%C3%A1!%0A%0AGostaria%20de%20falar%20sobre%20uma%20proposta%20ou%20parceria%20com%20a%20Zeloo.%0A%0A-%20Nome%3A%0A-%20Telefone%3A%0A-%20Empresa%2FCondom%C3%ADnio%3A%0A-%20Mensagem%3A%0A"
            className="group p-10 bg-slate-900 rounded-[3rem] border border-slate-800 hover:shadow-2xl hover:shadow-slate-200 transition-all text-center no-underline outline-none"
          >
            <div className="w-16 h-16 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <h3 className="text-xl font-black text-white mb-2">E-mail Direto</h3>
            <p className="text-slate-400 text-sm font-medium mb-6">
              Para propostas corporativas e parcerias em condomínios.
            </p>
            <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">
              Enviar proposta →
            </span>
          </a>
        </div>

        {/* ✅ Agora fica 1 coluna (sem "Conheça seu Time") */}
        <div className="max-w-3xl mx-auto">
          {/* Formulário */}
          <div
            id="contact-form"
            className="bg-slate-50 p-10 md:p-16 rounded-[4rem] border border-slate-100 scroll-mt-24"
          >
            {sent ? (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-emerald-100">
                  ✓
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">Mensagem preparada!</h3>
                <p className="text-slate-500 font-medium mb-8">
                  Abrimos o WhatsApp com sua mensagem pronta. Se precisar, envie outra.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setLoading(false);
                  }}
                  className="text-indigo-600 font-black text-xs uppercase tracking-widest"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-slate-900 mb-8">
                  Fale com um Especialista
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Seu Nome
                      </label>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                        Seu Telefone
                      </label>
                      <input
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        placeholder="(DDD) 99999-9999"
                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Assunto
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all appearance-none"
                    >
                      <option>Dúvida sobre Planos</option>
                      <option>Serviços Customizados</option>
                      <option>Parceria em Condomínios</option>
                      <option>Outros Assuntos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      Mensagem
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all h-32"
                    />
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Enviar Solicitação'
                    )}
                  </button>
                </form>

                <p className="text-slate-400 text-xs font-medium mt-6 text-center">
                  Ao enviar, sua mensagem será aberta no WhatsApp da Zeloo para atendimento rápido.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactConsultant;