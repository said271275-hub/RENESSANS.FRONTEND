import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarCheck,
  DollarSign,
  CreditCard,
  Trophy,
  LogOut,
  Menu,
  X,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AccountCredentialsModal } from '../components/AccountCredentialsModal';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const location = useLocation();

  // Collapsible sidebar state (saved in localStorage for convenience)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('renesans_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('renesans_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Define nav links per role
  let navItems: NavItem[] = [];

  if (user?.role === 'ADMIN') {
    navItems = [
      { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
      { to: '/admin/payments', label: "To'lovlar", icon: <CreditCard className="w-5 h-5" /> },
      { to: '/admin/students', label: 'O\'quvchilar', icon: <Users className="w-5 h-5" /> },
      { to: '/admin/teachers', label: 'O\'qituvchilar', icon: <GraduationCap className="w-5 h-5" /> },
      { to: '/admin/groups', label: 'Guruhlar', icon: <Layers className="w-5 h-5" /> },
      { to: '/admin/attendance', label: 'Davomat', icon: <CalendarCheck className="w-5 h-5" /> },
    ];
  } else if (user?.role === 'MANAGER') {
    navItems = [
      { to: '/manager', label: 'Umumiy ko\'rinish', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
      { to: '/manager/finance', label: 'Moliya', icon: <DollarSign className="w-5 h-5" /> },
      { to: '/manager/payments', label: "To'lovlar", icon: <CreditCard className="w-5 h-5" /> },
      { to: '/manager/ratings', label: 'O\'quvchilar reytingi', icon: <Trophy className="w-5 h-5" /> },
    ];
  } else if (user?.role === 'TEACHER') {
    navItems = [
      { to: '/teacher', label: 'Bosh sahifa', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
      { to: '/teacher/groups', label: 'Guruhlar', icon: <Layers className="w-5 h-5" /> },
      { to: '/teacher/attendance', label: 'Davomat', icon: <CalendarCheck className="w-5 h-5" /> },
    ];
  }

  // Get active title
  const currentNav = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const pageTitle = currentNav?.label || 'Boshqaruv Paneli';

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex bg-[var(--bg-color)] text-[var(--text-primary)]">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col justify-between neu-raised border-r border-[var(--border-subtle)] transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-[76px] p-3' : 'lg:w-64 w-72 p-5'}`}
      >
        {/* Toggle Collapse Arrow Button (Kichkina strelka) */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3.5 top-6 z-50 w-7 h-7 rounded-full neu-raised border border-[var(--border-subtle)] bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-red-500 items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          title={isCollapsed ? "Menyuni ochish" : "Menyuni yopish"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="space-y-5">
          {/* Logo & Brand */}
          <div className={`flex items-center pb-3 border-b border-[var(--border-subtle)] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div
                onClick={toggleSidebar}
                className="w-10 h-10 shrink-0 rounded-2xl neu-inset flex items-center justify-center text-[var(--accent)] font-black text-xl shadow-[var(--shadow-inset-sm)] cursor-pointer hover:scale-105 transition-transform"
                title="RENESSANS"
              >
                <BookOpen className="w-5 h-5 text-indigo-500" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden transition-all duration-200">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-black text-base tracking-tight leading-tight">RENESSANS</h1>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium truncate">O'quv Markazi</p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={closeMobile}
              className="lg:hidden p-1.5 rounded-xl neu-button text-[var(--text-secondary)]"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div
            className={`neu-inset rounded-2xl flex items-center border border-[var(--border-subtle)] transition-all ${
              isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'
            }`}
            title={isCollapsed ? `${user?.fullName} (${user?.role})` : undefined}
          >
            <div className="w-9 h-9 shrink-0 rounded-xl neu-raised flex items-center justify-center font-black text-indigo-500 text-sm shadow-sm">
              {user?.fullName.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-[var(--text-primary)]">{user?.fullName}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <Badge role={user?.role} />
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5 pt-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'neu-inset text-indigo-600 dark:text-indigo-400 font-bold shadow-[var(--shadow-inset)] border-l-4 border-indigo-500'
                      : 'hover:neu-raised-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">

          {/* Telegram Bot Link */}
          <a
            href="https://t.me/renessanss_bot"
            target="_blank"
            rel="noopener noreferrer"
            title="@renessanss_bot — Telegram bot"
            className={`flex items-center rounded-2xl transition-all duration-200 group bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 hover:from-sky-500/20 hover:to-blue-500/20 hover:border-sky-500/40 hover:scale-[1.02] active:scale-95 ${
              isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-3 py-2.5'
            }`}
          >
            {/* Telegram Icon (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 shrink-0 text-sky-500 group-hover:text-sky-400 transition-colors"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.927 14.147l-2.95-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.211.412z" />
            </svg>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-sky-500 group-hover:text-sky-400 leading-tight">
                  Telegram Bot
                </p>
                <p className="text-[10px] text-[var(--text-muted)] font-mono leading-tight">
                  @renessanss_bot
                </p>
              </div>
            )}
          </a>

          <Button
            variant="danger"
            size="md"
            onClick={logout}
            className={`w-full shadow-[var(--shadow-raised-sm)] !py-2.5 ${
              isCollapsed ? '!px-0 justify-center' : 'justify-start gap-2.5'
            }`}
            title={isCollapsed ? "Chiqish" : undefined}
            icon={<LogOut className="w-4 h-4 shrink-0" />}
          >
            {!isCollapsed && <span>Chiqish</span>}
          </Button>

          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-medium px-1">
              <span>RENESSANS v1.0</span>
              <span className="flex items-center gap-1 text-indigo-500 font-semibold">
                <Sparkles className="w-3 h-3" /> Soft UI
              </span>
            </div>
          ) : (
            <div className="flex justify-center text-indigo-500">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-6 sm:px-8 neu-raised border-b border-[var(--border-subtle)] flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl neu-button text-[var(--text-primary)]"
              aria-label="Menyu ochish"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button
                type="button"
                size="sm"
                onClick={() => setAccountSettingsOpen(true)}
                aria-label="Hisob ma'lumotlarini o'zgartirish"
                title="Hisob ma'lumotlari"
                icon={<Settings className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Hisob</span>
              </Button>
            )}
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-[var(--border-subtle)]">
              <div className="text-right">
                <p className="text-xs font-bold leading-tight text-[var(--text-primary)]">{user?.fullName}</p>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{user?.login}</p>
              </div>
              <div className="w-9 h-9 rounded-full neu-raised flex items-center justify-center font-bold text-sm text-indigo-500 border border-[var(--border-subtle)]">
                {user?.fullName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <AccountCredentialsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </div>
  );
};
