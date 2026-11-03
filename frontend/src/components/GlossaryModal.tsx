import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';
import { GlossaryResponse } from '../types';

interface GlossaryViewProps {
  glossaryData: GlossaryResponse | null;
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({ glossaryData }) => {
  if (!glossaryData) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading Add-on Glossary data...</p>
      </div>
    );
  }

  const { research_sources, canonical_glossary } = glossaryData;

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Automated Add-on Normalization & Glossary
          </h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Different car insurance companies use marketing names for identical coverage concepts (for example, Provider B calls Zero Depreciation <em>"Bumper to Bumper"</em>, Provider C calls it <em>"Nil Depreciation"</em>, and Provider A tags it as <code>ZERO_DEP</code>). AutoCover normalizes all provider add-ons into unified canonical protection tiers based on public research across 4 leading Indian insurers.
        </p>

        {/* Researched Insurers Grid */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Real-World Insurers Researched (Live Documentation Sources):
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {research_sources.map((src) => (
              <a
                key={src.insurer}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-300 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    <span>{src.insurer}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Verified: {src.key_concepts_verified.join(', ')}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                  Checked: {src.retrieved_date}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Canonical Covers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(canonical_glossary).map(([code, item]) => (
          <div
            key={code}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{item.name}</span>
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {code}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Recognized Provider Aliases & Synonyms:
              </span>
              <div className="flex flex-wrap gap-1">
                {item.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 font-medium"
                  >
                    "{alias}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
