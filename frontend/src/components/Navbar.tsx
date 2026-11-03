import React from 'react';
import { ShieldCheck, BookOpen, Clock, FileCheck2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'compare' | 'policies' | 'glossary';
  setActiveTab: (tab: 'compare' | 'policies' | 'glossary') => void;
  savedPolicyCount: number;
  expiringCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedPolicyCount,
  expiringCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('compare')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">AutoCover</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">Smart Vehicle Insurance Comparison</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'compare'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Compare Plans</span>
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'policies'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>My Policies</span>
              {savedPolicyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-slate-200 text-slate-800">
                  {savedPolicyCount}
                </span>
              )}
              {expiringCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                  {expiringCount} expiring
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'glossary'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Add-on Glossary</span>
            </button>
          </nav>

          {/* Reference Date Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Today: <strong className="text-slate-800">10 Nov 2026</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
