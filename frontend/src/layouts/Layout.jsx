import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { useHealthCheck } from '../hooks/useApi';
import HealthCheck from '../components/HealthCheck';
import {
  LayoutDashboard,
  Network,
  Package,
  TrendingUp,
  FlaskConical,
  ArrowRightLeft,
  MessageSquare,
  ClipboardCheck,
  Menu,
  X,
  Globe,
  Bell,
  Search,
  ChevronDown,
  ChevronLeft,
  ShieldCheck,
  Layers
} from 'lucide-react';

const navSections = [
  {
    category: 'OPERATIONS',
    items: [
      { path: '/', icon: LayoutDashboard, labelKey: 'navDashboard' },
      { path: '/network', icon: Network, labelKey: 'navDigitalTwin' },
      { path: '/inventory', icon: Package, labelKey: 'navInventory' },
    ]
  },
  {
    category: 'ANALYTICS & AI',
    items: [
      { path: '/forecast', icon: TrendingUp, labelKey: 'navForecast' },
      { path: '/simulator', icon: FlaskConical, labelKey: 'navSimulator' },
      { path: '/redistribution', icon: ArrowRightLeft, labelKey: 'navRedistribution' },
      { path: '/copilot', icon: MessageSquare, labelKey: 'navCopilot' },
    ]
  },
  {
    category: 'GOVERNANCE & AUDIT',
    items: [
      { path: '/approvals', icon: ClipboardCheck, labelKey: 'navApprovals' },
    ]
  }
];

export default function Layout() {
  const { language, toggleLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { status, retry } = useHealthCheck();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '';
    return location.pathname.startsWith(path);
  };

  // Dynamic page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard';
    if (path.startsWith('/network')) return language === 'bn' ? 'ডিজিটাল টুইন' : 'Digital Twin';
    if (path.startsWith('/inventory')) return language === 'bn' ? 'ওষুধ ইনভেন্টরি' : 'Medicine Inventory';
    if (path.startsWith('/forecast')) return language === 'bn' ? 'চাহিদা পূর্বাভাস' : 'AI Forecast Center';
    if (path.startsWith('/simulator')) return language === 'bn' ? 'ব্যাঘাত সিমুলেটর' : 'Disruption Simulator';
    if (path.startsWith('/redistribution')) return language === 'bn' ? 'স্মার্ট পুনর্বণ্টন' : 'Stock Redistribution';
    if (path.startsWith('/copilot')) return language === 'bn' ? 'বাংলা এআই কোপাইলট' : 'AI Copilot';
    if (path.startsWith('/approvals')) return language === 'bn' ? 'অনুমোদন ও অডিট' : 'Approvals & Audit';
    return 'Overview';
  };

  const pageTitle = getPageTitle();

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#00a896] focus:text-white focus:rounded-lg focus:font-bold focus:shadow-xl"
      >
        Skip to main content
      </a>

      <HealthCheck status={status} onRetry={retry} />

      <div className="min-h-screen bg-[#f4f6f9] text-slate-800 flex selection:bg-[#00a896]/20 selection:text-[#072c33]">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation — Styled after Figma SCM Deep Forest Teal */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#072c33] border-r border-[#0b3d47]
            transition-all duration-300 ease-in-out flex flex-col justify-between shrink-0
            ${collapsed ? 'w-20' : 'w-64'}
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          aria-label="Main Navigation"
        >
          {/* Logo Brand Header */}
          <div>
            <div className={`flex items-center gap-3 px-5 py-5 border-b border-[#0b3d47] ${collapsed ? 'justify-center px-2' : ''}`}>
              {/* Figma SCM Turquoise Dual-Loop Mark */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a896] to-[#00e5ff] p-0.5 shadow-sm shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#072c33] rounded-[10px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00a896]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>

              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-white tracking-wider">PROBAHO</span>
                  </div>
                  <p className="text-[10px] text-teal-200/70 truncate tracking-wide">
                    {t('appSubtitle', language)}
                  </p>
                </div>
              )}
            </div>

            {/* Nav Items Grouped */}
            <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  {!collapsed && (
                    <div className="px-3 text-[10px] font-bold text-teal-200/40 uppercase tracking-widest mb-1.5">
                      {section.category}
                    </div>
                  )}
                  {section.items.map(({ path, icon: Icon, labelKey }) => {
                    const active = isActive(path);
                    return (
                      <NavLink
                        key={path}
                        to={path}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed ? t(labelKey, language) : undefined}
                        className={`
                          flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150
                          ${collapsed ? 'justify-center px-0' : ''}
                          ${
                            active
                              ? 'bg-[#00a896] text-white shadow-sm font-semibold'
                              : 'text-teal-100/75 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-teal-200/80'}`} aria-hidden="true" />
                        {!collapsed && <span className="truncate">{t(labelKey, language)}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* Footer & Collapse Toggle */}
          <div className="p-3 border-t border-[#0b3d47] flex items-center justify-between">
            {!collapsed ? (
              <div className="text-[11px] text-teal-200/60 leading-tight pr-2">
                <span className="font-bold text-white tracking-wide">PROBAHO</span>
                <span className="text-[10px] text-teal-300/60 ml-1.5">v2.4</span>
              </div>
            ) : null}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition hidden lg:flex items-center justify-center mx-auto"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar — Styled after Figma SCM White Topbar */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
            {/* Left: Mobile Toggle & Page Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <span className="text-sm font-bold text-slate-800 tracking-tight">
                {pageTitle}
              </span>
            </div>

            {/* Center: Search Input */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'ওষুধ, ব্যাচ বা স্বাস্থ্যকেন্দ্র অনুসন্ধান করুন...' : 'Search medicine, batch, facility, supplier...'}
                  className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00a896] focus:outline-none transition-colors"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  ⌘K
                </span>
              </div>
            </div>

            {/* Right: User Profile & Actions */}
            <div className="flex items-center gap-3">

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">3 Alerts</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      <div className="p-3 text-xs hover:bg-slate-50 cursor-pointer">
                        <div className="font-semibold text-rose-600">Stockout Risk Flagged</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">Pirganj UHC Paracetamol cover &lt; 4 days</div>
                      </div>
                      <div className="p-3 text-xs hover:bg-slate-50 cursor-pointer">
                        <div className="font-semibold text-amber-600">Monsoon Weather Alert</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">Rangpur corridor heavy rainfall (&gt;50mm)</div>
                      </div>
                      <div className="p-3 text-xs hover:bg-slate-50 cursor-pointer">
                        <div className="font-semibold text-teal-600">Transfer Recommended</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">OR-Tools generated 3 feasible transfers</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                aria-label={`Switch language to ${language === 'en' ? 'Bangla' : 'English'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition shadow-xs"
              >
                <Globe className="w-3.5 h-3.5 text-[#00a896]" aria-hidden="true" />
                <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
              </button>

              {/* User Profile Pill — Matching Figma SCM template */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00a896] to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  AI
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Dr. Aminul Islam</div>
                  <div className="text-[10px] text-slate-500">Central Supply Officer</div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Outlet */}
          <main id="main-content" tabIndex="-1" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
