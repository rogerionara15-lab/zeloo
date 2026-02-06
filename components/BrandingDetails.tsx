
import React from 'react';
import { BrandingInfo } from '../types';

interface BrandingDetailsProps {
  branding: BrandingInfo;
}

const BrandingDetails: React.FC<BrandingDetailsProps> = ({ branding }) => {
  return (
    <section id="sobre" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-8">Nossa Identidade</h2>
            
            <div className="space-y-10">
              <div>
                <h3 className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-2">Missão</h3>
                <p className="text-xl text-slate-700 font-medium leading-relaxed">
                  "{branding.mission}"
                </p>
              </div>

              <div>
                <h3 className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-2">Visão</h3>
                <p className="text-xl text-slate-700 font-medium leading-relaxed">
                  "{branding.vision}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {branding.values.map((val, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {i + 1}
                    </div>
                    <span className="font-bold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 relative">
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">
              Startup do Ano
            </div>
            <h3 className="text-2xl font-bold mb-6">Proposta de Valor</h3>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              {branding.valueProposition}
            </p>
            
            <hr className="mb-8 border-slate-100" />
            
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              Público que confia na {branding.name}
            </h4>
            <div className="flex flex-wrap gap-2">
              {branding.targetAudience.map((audience, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium">
                  {audience}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandingDetails;
