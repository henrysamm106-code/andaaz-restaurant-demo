import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Bot,
  Users,
  Bell,
  BarChart3,
  SlidersHorizontal,
  Settings,
  Sparkles,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { Link, useRouter } from '../../lib/router';
import { ASSETS } from '../../data/assets';
import { useDashboard } from '../../context/DashboardContext';

interface NavLinkItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function getKarachiClockDisplay(): string {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: 'short',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  return `${date} · ${time} PKT`;
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { pathname, navigate } = useRouter();
  const {
    snapshot,
    loading,
    error,
    refreshWorkspace,
    globalSearch,
    setGlobalSearch,
    toasts,
    dismissToast,
    workspaceMode,
    adminToken,
    loginAdmin,
    logoutAdmin,
  } = useDashboard();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clockText, setClockText] = useState(getKarachiClockDisplay);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ passcodeConfigured: boolean; claimAllowed: boolean } | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => setClockText(getKarachiClockDisplay()), 20000);
    return () => clearInterval(id);
  }, []);

  const unreadNotifications = snapshot
    ? snapshot.notifications.filter((n) => !n.isRead).length
    : 0;
  const pendingReservations = snapshot
    ? snapshot.reservations.filter((r) => r.status === 'pending').length
    : 0;

  const workspaceLinks: NavLinkItem[] = [
    { label: 'Overview', to: '/staff-demo', icon: LayoutDashboard },
    {
      label: 'Reservations',
      to: '/staff-demo/reservations',
      icon: CalendarDays,
      badge: pendingReservations > 0 ? pendingReservations : undefined,
    },
    { label: 'Reservation Calendar', to: '/staff-demo/calendar', icon: CalendarRange },
    { label: 'AI Concierge', to: '/staff-demo/ai-concierge', icon: Bot },
    { label: 'Customers', to: '/staff-demo/customers', icon: Users },
    {
      label: 'Notifications',
      to: '/staff-demo/notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { label: 'Analytics', to: '/staff-demo/analytics', icon: BarChart3 },
  ];

  const configLinks: NavLinkItem[] = [
    { label: 'Availability Settings', to: '/staff-demo/availability', icon: SlidersHorizontal },
    { label: 'Automation Settings', to: '/staff-demo/settings', icon: Settings },
    { label: 'Demo Centre', to: '/automation-demo', icon: Sparkles },
  ];

  const openAuthModal = async () => {
    setAuthError(null);
    setPasscodeInput('');
    setAuthModalOpen(true);
    try {
      const res = await fetch('/api/admin/auth/status');
      const json = await res.json();
      if (json.ok) {
        const isSet = Boolean(json.passcodeSet ?? json.passcodeConfigured);
        setAuthStatus({
          passcodeConfigured: isSet,
          claimAllowed: !isSet,
        });
      }
    } catch {
      setAuthStatus({ passcodeConfigured: false, claimAllowed: true });
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    const isClaim = Boolean(authStatus && !authStatus.passcodeConfigured && authStatus.claimAllowed);
    const result = await loginAdmin(passcodeInput, isClaim);
    setAuthSubmitting(false);
    if (!result.ok) {
      setAuthError(result.message || 'Authentication failed.');
    } else {
      setAuthModalOpen(false);
    }
  };

  const logo = ASSETS['logo-original'];

  const renderNavSection = (heading: string, items: NavLinkItem[]) => (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FAF8F3]/45">
          {heading}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={`flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              active
                ? 'bg-[#7E4D54] text-[#FAF8F3]'
                : 'text-[#FAF8F3]/75 hover:bg-[#FAF8F3]/8 hover:text-[#FAF8F3]'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </span>
            {!collapsed && item.badge !== undefined && (
              <span className="rounded-md bg-[#FAF8F3]/18 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#FAF8F3]">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#172332] flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#172332] text-[#FAF8F3] border-r border-[#172332]/20 shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#FAF8F3]/10">
          <Link to="/staff-demo" className="flex items-center gap-2.5 min-w-0">
            <img
              src={logo.localPath}
              alt={logo.alt}
              className="h-9 w-9 rounded-md bg-[#FAF8F3] p-0.5 object-contain shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-serif text-lg font-medium leading-none text-[#FAF8F3] truncate">
                  Andaaz
                </p>
                <p className="text-[10px] text-[#FAF8F3]/60 truncate mt-0.5">
                  Fort Road, Lahore
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[#FAF8F3]/70 hover:text-[#FAF8F3] hover:bg-[#FAF8F3]/10"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav
          aria-label="Management dashboard navigation"
          className="flex-1 overflow-y-auto px-3 py-5 space-y-6"
        >
          {renderNavSection('Workspace', workspaceLinks)}
          {renderNavSection('Configuration', configLinks)}
        </nav>

        <div className="p-3 border-t border-[#FAF8F3]/10 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#FAF8F3]/75 hover:text-[#FAF8F3] hover:bg-[#FAF8F3]/8 whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Public Website</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-[#172332]/50 backdrop-blur-xs flex"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-68 bg-[#172332] text-[#FAF8F3] h-full flex flex-col p-4 space-y-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]/10">
              <div className="flex items-center gap-2.5">
                <img
                  src={logo.localPath}
                  alt={logo.alt}
                  className="h-9 w-9 rounded-md bg-[#FAF8F3] p-0.5 object-contain"
                />
                <div>
                  <p className="font-serif text-lg font-medium leading-none">Andaaz</p>
                  <p className="text-[10px] text-[#FAF8F3]/60">Reservation Operations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#FAF8F3]/20 text-[#FAF8F3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-6 flex-1">
              {renderNavSection('Workspace', workspaceLinks)}
              {renderNavSection('Configuration', configLinks)}
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#FAF8F3]/80 border border-[#FAF8F3]/15"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Public Website
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#FAF8F3] border-b border-[#172332]/10 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open dashboard menu"
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 text-[#172332]"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="relative max-w-sm w-full hidden sm:block">
              <Search className="h-3.5 w-3.5 text-[#4F5D6A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    pathname !== '/staff-demo/reservations' &&
                    pathname !== '/staff-demo/customers'
                  ) {
                    navigate('/staff-demo/reservations');
                  }
                }}
                placeholder="Search guests, phone, or booking ref…"
                className="w-full rounded-lg border border-[#172332]/15 bg-white pl-8 pr-3 py-1.5 text-xs text-[#172332] placeholder:text-[#4F5D6A]/70 focus:outline-none focus:border-[#7E4D54]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-[#F2EDE3] border border-[#172332]/10 text-[11px] font-medium text-[#172332] tabular-nums whitespace-nowrap">
              {clockText}
            </span>

            {workspaceMode === 'production' && adminToken ? (
              <button
                type="button"
                onClick={logoutAdmin}
                title="Switch back to Demo Workspace"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DCFCE7] border border-[#16A34A]/30 text-[11px] font-medium text-[#166534] whitespace-nowrap"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Production · Switch to Demo
                <LogOut className="h-3 w-3 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E0E7FF] border border-[#3B82F6]/25 text-[11px] font-medium text-[#1E40AF] hover:bg-[#DBEAFE] whitespace-nowrap"
              >
                Demo Mode · Synthetic Data
              </button>
            )}

            <Link
              to="/staff-demo/notifications"
              aria-label={`Notifications (${unreadNotifications} unread)`}
              className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 bg-white text-[#172332] hover:bg-[#F2EDE3]"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#7E4D54] text-[#FAF8F3] text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={refreshWorkspace}
              aria-label="Refresh workspace data"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 bg-white text-[#172332] hover:bg-[#F2EDE3]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Page Title Strip */}
        <div className="bg-[#FAF8F3] border-b border-[#172332]/10 px-4 sm:px-6 py-5">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332] leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-[#4F5D6A] mt-1">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
          </div>
        </div>

        {/* Workspace Body */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 outline-none">
          <div className="max-w-[1400px] mx-auto">
            {loading && !snapshot ? (
              <div className="rounded-2xl bg-white border border-[#172332]/10 p-10 text-center text-sm text-[#4F5D6A]">
                Loading reservation operations workspace…
              </div>
            ) : error && !snapshot ? (
              <div className="rounded-2xl bg-white border border-[#DC2626]/30 p-8 text-center space-y-3">
                <p className="text-sm font-medium text-[#991B1B]">{error}</p>
                <button
                  type="button"
                  onClick={refreshWorkspace}
                  className="rounded-lg bg-[#172332] text-white px-4 py-2 text-xs font-medium"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg flex items-start justify-between gap-3 bg-white ${
                t.tone === 'error'
                  ? 'border-[#DC2626]/35'
                  : t.tone === 'success'
                    ? 'border-[#16A34A]/35'
                    : 'border-[#172332]/15'
              }`}
            >
              <div className="text-xs">
                <p className="font-semibold text-[#172332]">{t.title}</p>
                {t.detail && <p className="text-[#4F5D6A] mt-0.5">{t.detail}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="text-[#4F5D6A] hover:text-[#172332]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Production Manager Passcode Modal */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#172332]/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Production Manager Authentication"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            className="bg-[#FAF8F3] border border-[#172332]/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#172332]">
                  {authStatus && !authStatus.passcodeConfigured && authStatus.claimAllowed
                    ? 'Set Manager Passcode (First-Run Setup)'
                    : 'Production Manager Login'}
                </h2>
                <p className="text-xs text-[#4F5D6A] mt-1">
                  {authStatus && !authStatus.passcodeConfigured && authStatus.claimAllowed
                    ? 'No manager passcode is configured yet. Choose any 8+ character passcode to unlock the Production workspace (Demo Mode stays open without any password).'
                    : 'Enter the server manager passcode (MANAGER_ACCESS_PASSCODE or the passcode claimed during setup) to view live non-demo records. Demo Mode stays open without login.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 text-[#172332]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {authError && (
              <div className="rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 px-3 py-2 text-xs text-[#991B1B]">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#172332] mb-1">
                  Manager Passcode
                </label>
                <input
                  type="password"
                  minLength={8}
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="rounded-lg border border-[#172332]/15 px-3.5 py-2 text-xs font-medium text-[#172332]"
                >
                  Stay in Demo
                </button>
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="rounded-lg bg-[#172332] text-white px-4 py-2 text-xs font-medium disabled:opacity-50"
                >
                  {authSubmitting ? 'Verifying…' : 'Open Production Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
