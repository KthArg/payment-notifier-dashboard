'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { clearToken, api, SenderStatus } from '@/lib/api';
import {
  LayoutDashboard, Users, CreditCard, BarChart3, LogOut, Menu, X,
  AlertTriangle, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard, badge: null as string | null },
  { href: '/members',   label: 'Miembros',       icon: Users,           badge: null as string | null },
  { href: '/payments',  label: 'Pagos',          icon: CreditCard,      badge: null as string | null },
  { href: '/reports',   label: 'Reportes',       icon: BarChart3,       badge: null as string | null },
  { href: '/unmatched', label: 'Sin identificar', icon: AlertTriangle,   badge: null as string | null },
  { href: '/external',  label: 'Externas',       icon: Ban,             badge: null as string | null },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unknownCount, setUnknownCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    api.sinpeSenders.badge().then(counts => {
      setUnknownCount((counts as Record<SenderStatus, number>).unknown ?? 0);
    }).catch(() => {});
  }, [router]);

  // close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'flex flex-col bg-white border-slate-100',
      mobile
        ? 'fixed inset-y-0 left-0 z-40 w-64 shadow-xl border-r animate-scale-in'
        : 'hidden lg:flex w-60 flex-shrink-0 border-r h-screen sticky top-0',
    )}>
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Panel de cobros</span>
          {mobile && (
            <button onClick={() => setOpen(false)} className="ml-auto p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const showBadge = href === '/unmatched' && unknownCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                pathname.startsWith(href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-semibold">
                  {unknownCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 animate-fade-in lg:hidden"
            onClick={() => setOpen(false)}
          />
          <Sidebar mobile />
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Panel de cobros</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
