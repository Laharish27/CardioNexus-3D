import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Activity,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
} from 'lucide-react';
import { ActiveNavSection } from '../../types/cardiac';

interface SidebarProps {
  activeSection: ActiveNavSection;
  onNavigate: (section: ActiveNavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveNavSection,
      label: 'Overview',
      subtitle: 'Executive Risk Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'assessment' as ActiveNavSection,
      label: 'Patient Assessment',
      subtitle: 'Manual & Report Parsing',
      icon: UserCheck,
    },
    {
      id: 'explorer' as ActiveNavSection,
      label: '3D Heart Explorer',
      subtitle: 'Anatomical Twin & Cavities',
      icon: Activity,
    },
    {
      id: 'explainability' as ActiveNavSection,
      label: 'Explainability (SHAP)',
      subtitle: 'Feature Attributions & What-If',
      icon: Sparkles,
    },
    {
      id: 'performance' as ActiveNavSection,
      label: 'Model Performance',
      subtitle: '5-Fold CV & Metrics',
      icon: BarChart3,
    },
    {
      id: 'reports' as ActiveNavSection,
      label: 'Clinical Reports',
      subtitle: 'Export & Print Summary',
      icon: FileSpreadsheet,
    },
    {
      id: 'about' as ActiveNavSection,
      label: 'About & Safety',
      subtitle: 'Citations & Methodology',
      icon: ShieldCheck,
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 transition-all duration-300 flex flex-col justify-between shrink-0 select-none print:hidden z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-3.5">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 tracking-tight text-sm leading-tight">
                  CardioNexus<span className="text-teal-600">3D</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">
                  Cardiovascular AI Suite
                </div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 mx-auto rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors hidden md:flex items-center justify-center"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs border border-teal-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-500 group-hover:text-teal-600 group-hover:bg-teal-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <div className="text-xs truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">
                      {item.subtitle}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Badge */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Track A</span>
              <span className="bg-teal-100 text-teal-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                Active
              </span>
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Z-Alizadeh Sani Cohort (303 Pts) • Zero Leakage ML
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-slate-400">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
