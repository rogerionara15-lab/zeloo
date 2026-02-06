
import React, { useState } from 'react';

interface ContactConsultantProps {
  onBack: () => void;
}

const ContactConsultant: React.FC<ContactConsultantProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulação de envio
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 2000);
  };

  const consultants = [
    { name: 'Ricardo Santos', role: 'Especialista em Elétrica', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200' },
    { name: 'Ana Oliveira', role: 'Consultora de Planos', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
    { name: 'Bruno Lima', role: 'Gestor de Manutenção', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
  ];

  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">Consultoria Zeloo</h1>
          <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">
            Não somos apenas um serviço, somos seus parceiros na gestão do seu lar. Escolha como quer falar com a gente.
          </p>
        </div>

        {/* Canais de Atendimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <a 
            href="https://wa.me/5511999999999" 
            target="_blank" 
            className="group p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-100 transition-all text-center no-underline"
          >
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-emerald-200 group-hover:scale-110 transition-transform">
              📱
            </div>
            <h3 className="text-xl font-black text-emerald-900 mb-2">WhatsApp</h3>
            <p className="text-emerald-700/70 text-sm font-medium mb-6">Atendimento imediato para dúvidas rápidas e orçamentos.</p>
            <span className="text-emerald-600 font-black text-xs uppercase tracking-widest">Abrir conversa →</span>
          </a>

          <button 
            onClick={scrollToForm}
            className="group p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-center cursor-pointer outline-none"
          >
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">
              📅
            </div>
            <h3 className="text-xl font-black text-indigo-900 mb-2">Agendar Call</h3>
            <p className="text-indigo-700/70 text-sm font-medium mb-6">Marque uma reunião de 15 min para entender nossos planos.</p>
            <span className="text-indigo-600 font-black text-xs uppercase tracking-widest">Disponível amanhã →</span>
          </button>

          <a 
            href="mailto:parcerias@zeloo.com?subject=Proposta de Manutenção B2B"
            className="group p-10 bg-slate-900 rounded-[3rem] border border-slate-800 hover:shadow-2xl hover:shadow-slate-200 transition-all text-center no-underline outline-none"
          >
            <div className="w-16 h-16 bg-white text-slate-900 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <h3 className="text-xl font-black text-white mb-2">E-mail Direto</h3>
            <p className="text-slate-400 text-sm font-medium mb-6">Para propostas corporativas e parcerias em condomínios.</p>
            <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">Enviar proposta →</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Formulário */}
          <div id="contact-form" className="bg-slate-50 p-10 md:p-16 rounded-[4rem] border border-slate-100 scroll-mt-24">
            {sent ? (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-emerald-100">✓</div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">Mensagem Enviada!</h3>
                <p className="text-slate-500 font-medium mb-8">Um de nossos especialistas entrará em contato em até 2 horas úteis.</p>
                <button onClick={() => setSent(false)} className="text-indigo-600 font-black text-xs uppercase tracking-widest">Enviar outra mensagem</button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-slate-900 mb-8">Fale com um Especialista</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Seu Nome</label>
                      <input required type="text" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Seu Telefone</label>
                      <input required type="tel" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Assunto</label>
                    <select className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all appearance-none">
                      <option>Dúvida sobre Planos</option>
                      <option>Serviços Customizados</option>
                      <option>Parceria em Condomínios</option>
                      <option>Outros Assuntos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Mensagem</label>
                    <textarea required rows={4} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all h-32"></textarea>
                  </div>
                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Enviar Solicitação'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Time de Especialistas */}
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-10">Conheça seu Time</h2>
            <div className="space-y-8">
              {consultants.map((person, idx) => (
                <div key={idx} className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg group-hover:rotate-3 transition-transform">
                    <img src={person.img} alt={person.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">{person.name}</h4>
                    <p className="text-indigo-600 text-xs font-black uppercase tracking-widest">{person.role}</p>
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5].map(s => <span key={s} className="text-emerald-500 text-[10px]">★</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-indigo-900 rounded-[3rem] text-white relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
               <h3 className="text-lg font-bold mb-4">Horário de Atendimento</h3>
               <div className="space-y-2 text-sm text-indigo-100/70 font-medium">
                  <p className="flex justify-between"><span>Segunda a Sexta</span> <span>08h - 20h</span></p>
                  <p className="flex justify-between"><span>Sábados</span> <span>09h - 13h</span></p>
                  <p className="flex justify-between border-t border-white/10 pt-2 mt-2"><span>Emergências (App)</span> <span>24h / 7 dias</span></p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactConsultant;
