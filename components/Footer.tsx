
import React from 'react';
import { BrandingInfo } from '../types';

interface FooterProps {
  onAboutUsClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onFAQClick: () => void;
  onContactClick: () => void;
  onClientAreaClick: () => void;
  branding?: BrandingInfo;
}

const Footer: React.FC<FooterProps> = ({ 
  onAboutUsClick, 
  onPrivacyClick, 
  onTermsClick, 
  onFAQClick, 
  onContactClick, 
  onClientAreaClick,
  branding 
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-xl">Z</span>
              </div>
              <span className="text-2xl font-black text-white uppercase tracking-tighter">
                {branding?.name || 'Zeloo'}
              </span>
            </div>
            <p className="max-w-md leading-relaxed text-slate-400 font-medium">
              A maior rede de manutenção residencial inteligente do Brasil. Tecnologia própria para garantir que sua única preocupação em casa seja relaxar.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-black mb-8 uppercase tracking-widest text-[10px]">Institucional</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={onAboutUsClick} className="hover:text-indigo-400 transition-colors text-sm font-bold text-left w-full">Nossa História</button>
              </li>
              <li>
                <button onClick={onPrivacyClick} className="hover:text-indigo-400 transition-colors text-sm font-bold text-left w-full">Privacidade</button>
              </li>
              <li>
                <button onClick={onTermsClick} className="hover:text-indigo-400 transition-colors text-sm font-bold text-left w-full">Contrato de Serviço</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black mb-8 uppercase tracking-widest text-[10px]">Suporte e Gestão</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={onFAQClick} className="hover:text-indigo-400 transition-colors text-sm font-bold text-left w-full">Dúvidas Frequentes</button>
              </li>
              <li>
                <button onClick={onContactClick} className="hover:text-indigo-400 transition-colors text-sm font-bold text-left w-full">Falar com Consultor</button>
              </li>
              <li>
                <button onClick={onClientAreaClick} className="text-indigo-500 hover:text-white font-black text-sm transition-colors text-left w-full">Área do Assinante</button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              © 2024 {branding?.name || 'Zeloo'} • Inteligência em Manutenção Residencial
            </p>
          </div>
          <div className="flex gap-8">
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Tecnologia Zeloo Cloud</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
