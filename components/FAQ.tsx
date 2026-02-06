
import React, { useState } from 'react';

interface FAQProps {
  onBack: () => void;
  onContact: () => void;
}

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const FAQ: React.FC<FAQProps> = ({ onBack, onContact }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      id: 1,
      category: 'Geral',
      question: 'O que é a Zeloo?',
      answer: 'A Zeloo é uma plataforma de manutenção residencial por assinatura. Oferecemos uma solução completa para cuidar da sua casa, com equipe própria certificada, tecnologia de IA para diagnósticos e planos que cobrem reparos elétricos, hidráulicos e preventivos por um valor fixo mensal.'
    },
    {
      id: 2,
      category: 'Geral',
      question: 'A Zeloo atende em quais cidades?',
      answer: 'Atualmente estamos operando nas principais capitais e regiões metropolitanas do Brasil. Você pode consultar a disponibilidade para o seu CEP diretamente na tela de checkout.'
    },
    {
      id: 3,
      category: 'Planos',
      question: 'Posso cancelar minha assinatura a qualquer momento?',
      answer: 'Sim! Nos planos mensais, você pode cancelar quando quiser sem multas. Nos planos com fidelidade (semestral ou anual), o cancelamento antecipado pode estar sujeito a uma taxa administrativa conforme descrito nos Termos de Uso.'
    },
    {
      id: 4,
      category: 'Planos',
      question: 'O que o valor da assinatura cobre?',
      answer: 'A assinatura cobre 100% da mão de obra especializada para os serviços incluídos no seu plano. Materiais e peças de reposição (como lâmpadas, reparos de descarga ou fiação nova) não estão inclusos e podem ser fornecidos por você ou orçados separadamente pela Zeloo.'
    },
    {
      id: 5,
      category: 'Serviços',
      question: 'Quem são os técnicos que vão à minha casa?',
      answer: 'Diferente de marketplaces comuns, a Zeloo possui equipe própria. Nossos técnicos passam por um rigoroso processo de seleção, treinamento contínuo e verificação de antecedentes. Eles sempre estarão uniformizados e identificados.'
    },
    {
      id: 6,
      category: 'Serviços',
      question: 'Como funciona o atendimento de emergência?',
      answer: 'Emergências como vazamentos graves ou falta de energia total são tratadas com prioridade máxima. Dependendo do seu plano, o atendimento ocorre em um prazo de 2h a 4h após o chamado ser aberto no portal ou app.'
    },
    {
      id: 7,
      category: 'Agendamento',
      question: 'Como faço para agendar uma visita?',
      answer: 'O agendamento é feito de forma 100% digital através da sua Área do Cliente. Basta descrever o problema (você pode até usar fotos para nossa IA ajudar no diagnóstico) e escolher o melhor horário disponível na agenda do sistema.'
    },
    {
      id: 8,
      category: 'Segurança',
      question: 'A Zeloo oferece garantia sobre os serviços prestados?',
      answer: 'Sim. Todos os nossos serviços possuem garantia total. Se o problema persistir após a visita técnica, retornamos para realizar o ajuste sem qualquer custo adicional para o assinante.'
    }
  ];

  const filteredFaq = faqData.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="pt-32 pb-24 bg-slate-50 min-h-screen animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-16">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-8"
          >
            <span>←</span> Voltar para o Início
          </button>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Perguntas Frequentes</h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Tudo o que você precisa saber para ter paz de espírito na manutenção do seu lar.
          </p>
        </div>

        {/* Barra de Busca */}
        <div className="relative mb-16">
          <input 
            type="text"
            placeholder="O que você está procurando? (Ex: cancelamento, técnicos, emergência...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[2rem] px-8 py-6 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all shadow-xl shadow-slate-200/50 placeholder:text-slate-400 font-medium"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl">
            🔍
          </div>
        </div>

        {/* Lista de FAQ */}
        <div className="space-y-4 mb-20">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${openId === item.id ? 'border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
              >
                <button 
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-8 py-7 text-left flex justify-between items-center group"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60">{item.category}</span>
                    <span className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{item.question}</span>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${openId === item.id ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </button>
                
                <div 
                  className={`transition-all duration-500 ease-in-out ${openId === item.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-8 pb-8 pt-2">
                    <div className="h-px bg-slate-100 mb-6 w-full"></div>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
               <span className="text-5xl mb-6 block">🔎</span>
               <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum resultado encontrado</h3>
               <p className="text-slate-500 font-medium">Tente buscar por termos mais genéricos ou entre em contato.</p>
            </div>
          )}
        </div>

        {/* CTA Suporte */}
        <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
          </div>
          <h2 className="text-2xl font-black mb-4">Ainda tem dúvidas?</h2>
          <p className="text-slate-400 mb-10 max-w-md mx-auto">
            Nossa equipe de consultores está pronta para ajudar você a escolher o melhor plano para o seu perfil residencial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onContact}
              className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40"
            >
              Falar via Chat
            </button>
            <a 
              href="mailto:contato@zeloo.com" 
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Enviar E-mail
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FAQ;
