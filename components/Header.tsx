
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onOpenLogin: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
      isScrolled 
      ? 'py-4 px-6' 
      : 'py-8 px-6'
    }`}>
      <div className={`max-w-7xl mx-auto transition-all duration-700 rounded-[2rem] px-8 py-4 ${
        isScrolled 
        ? 'zeloo-glass shadow-2xl border border-slate-200/50' 
        : 'bg-transparent'
      }`}>
        <div className="flex justify-between items-center">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl group-hover:bg-indigo-600 transition-all duration-500 transform group-hover:rotate-6">
              <span className="text-white font-black text-2xl tracking-tighter">Z</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-950 uppercase">Zeloo</span>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-12">
            {['servicos', 'orcamento', 'planos', 'sobre'].map((id) => (
              <a 
                key={id}
                href={`#${id}`} 
                onClick={(e) => scrollToSection(e, id)}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-600 transition-all relative py-2"
              >
                {id}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenLogin}
              className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-950 transition-colors px-4"
            >
              Entrar
            </button>
            <button 
              onClick={onOpenLogin}
              className="bg-slate-950 text-white hover:bg-indigo-600 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95"
            >
              Área Vip
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
