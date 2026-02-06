
import React from 'react';
import { BRANDING_DATA } from '../constants';

interface AboutUsProps {
  onBack: () => void;
  onContact: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onBack, onContact }) => {
  return (
    <div className="pt-32 pb-24 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-12"
        >
          <span>←</span> Voltar para o Início
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Nossa História</span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8">
              Cuidamos da sua casa para você cuidar da sua vida.
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              A Zeloo nasceu de um problema comum: a dificuldade de encontrar manutenção residencial confiável, pontual e sem orçamentos abusivos. Decidimos que a paz de espírito em casa não deveria ser um luxo, mas um serviço inteligente.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square bg-slate-100 rounded-[3rem] overflow-hidden relative shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1581578731522-745d05cb9704?auto=format&fit=crop&q=80&w=800" 
                alt="Equipe Zeloo" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply"></div>
            </div>
            {/* Badge flutuante */}
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-xs">
              <p className="text-4xl font-black text-indigo-600 mb-1">98%</p>
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">De Satisfação</p>
              <p className="text-[10px] text-slate-400 font-medium italic">Baseado em mais de 5.000 atendimentos mensais realizados por nossa equipe.</p>
            </div>
          </div>
        </div>

        {/* DNA Zeloo */}
        <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 text-white mb-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-24 opacity-5">
            <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-16">O DNA Zeloo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: 'Tecnologia Própria', desc: 'Usamos IA para prever falhas na sua casa antes que elas aconteçam, garantindo manutenção preventiva real.', icon: '🧠' },
                { title: 'Equipe Zeloo', desc: 'Não somos um marketplace. Nossos técnicos são funcionários fixos, treinados e certificados pela nossa academia.', icon: '🛡️' },
                { title: 'Transparência', desc: 'Preço fixo, relatórios digitais detalhados e garantia total em cada parafuso apertado.', icon: '💎' },
              ].map((item, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-4xl mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cultura e Valores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start mb-32">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-8">Nossa Missão e Visão</h2>
            <div className="space-y-12">
              <div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Missão</p>
                <p className="text-2xl font-bold text-slate-700 leading-snug">"{BRANDING_DATA.mission}"</p>
              </div>
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Visão</p>
                <p className="text-2xl font-bold text-slate-700 leading-snug">"{BRANDING_DATA.vision}"</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-200">
             <h3 className="text-xl font-black text-slate-900 mb-8">Nossos Valores</h3>
             <div className="grid grid-cols-1 gap-6">
                {BRANDING_DATA.values.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">{idx + 1}</span>
                    <span className="font-bold text-slate-800">{val}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* CTA Bottom */}
        <div className="text-center bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Quer fazer parte dessa história?</h2>
          <p className="text-indigo-100 text-xl max-w-2xl mx-auto mb-12">
            Seja como cliente ou parceiro, estamos transformando o cuidado com as casas brasileiras.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button onClick={onBack} className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">Começar agora</button>
            <button onClick={onContact} className="bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-800 transition-all">Falar com um consultor</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
