
import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="pt-32 pb-24 bg-white animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de Página */}
        <div className="mb-16">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-[0.2em] mb-8"
          >
            <span>←</span> Voltar para o Início
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Política de Privacidade</h1>
          <p className="text-slate-500 font-medium">Última atualização: 24 de Maio de 2024</p>
        </div>

        {/* Conteúdo Legal */}
        <div className="prose prose-slate max-w-none space-y-12">
          
          <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl">📑</span>
              <h2 className="text-2xl font-bold text-slate-900 m-0">1. Compromisso com a Transparência</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Na Zeloo, a privacidade e a segurança dos seus dados são prioridades fundamentais. Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais ao utilizar nossa plataforma de manutenção residencial.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              2. Dados que Coletamos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-slate-200 rounded-2xl">
                <h3 className="font-bold text-slate-900 mb-2">Informações Cadastrais</h3>
                <p className="text-sm text-slate-500">Nome completo, CPF, e-mail, telefone e endereço completo da residência para prestação de serviço.</p>
              </div>
              <div className="p-6 border border-slate-200 rounded-2xl">
                <h3 className="font-bold text-slate-900 mb-2">Dados de Pagamento</h3>
                <p className="text-sm text-slate-500">Processados de forma criptografada pelo Mercado Pago. Não armazenamos seus dados de cartão em nossos servidores.</p>
              </div>
              <div className="p-6 border border-slate-200 rounded-2xl">
                <h3 className="font-bold text-slate-900 mb-2">Histórico de Manutenção</h3>
                <p className="text-sm text-slate-500">Relatos de problemas, fotos enviadas para diagnóstico e registros de visitas técnicas.</p>
              </div>
              <div className="p-6 border border-slate-200 rounded-2xl">
                <h3 className="font-bold text-slate-900 mb-2">Uso da Plataforma</h3>
                <p className="text-sm text-slate-500">Dados de navegação, cookies técnicos e logs de acesso para melhoria contínua da experiência.</p>
              </div>
            </div>
          </section>

          <section className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">3. Como Usamos Seus Dados</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1 rounded-lg">✅</span>
                <span>Para agendar e realizar visitas técnicas em sua residência.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1 rounded-lg">✅</span>
                <span>Para processar faturamentos de planos de assinatura.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1 rounded-lg">✅</span>
                <span>Para diagnósticos preventivos utilizando nossa Inteligência Artificial.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1 rounded-lg">✅</span>
                <span>Para suporte em casos de urgência reportados no portal.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              4. Seus Direitos (LGPD)
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium mb-6">
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você possui os seguintes direitos:
            </p>
            <div className="space-y-4">
              {[
                "Acesso aos seus dados pessoais armazenados.",
                "Correção de dados incompletos ou inexatos.",
                "Eliminação de dados tratados com seu consentimento.",
                "Portabilidade dos dados a outro fornecedor de serviço.",
                "Revogação do consentimento para marketing a qualquer momento."
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="font-black text-indigo-600 text-sm">0{i+1}</span>
                  <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-100 pt-12 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Dúvidas sobre seus dados?</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Nosso encarregado de dados (DPO) está disponível para ajudar você em qualquer questão de privacidade.</p>
            <a href="mailto:privacidade@zeloo.com" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Contatar DPO</a>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
