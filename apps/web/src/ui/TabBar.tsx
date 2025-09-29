"use client";
import React from 'react';
import { Home, Users, Lightbulb, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const TABS: TabItem[] = [
  { key: 'home', label: 'Dashboard', icon: <Home className="w-5 h-5" />, href: '/' },
  { key: 'players', label: 'Players', icon: <Users className="w-5 h-5" />, href: '/#players' },
  { key: 'insights', label: 'Insights', icon: <Lightbulb className="w-5 h-5" />, href: '/#insights' },
  { key: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/#settings' },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-[#0b1420]/80 border-t border-white/10 shadow-[0_-2px_16px_rgba(0,0,0,0.4)] pb-[calc(env(safe-area-inset-bottom))]"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(tab => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <li key={tab.key}>
              <button
                onClick={() => router.push(tab.href)}
                className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={`flex items-center justify-center rounded-xl p-2 mb-0.5 transition-all ${
                  active ? 'bg-indigo-500/20 text-indigo-300 shadow-inner shadow-indigo-500/20' : 'bg-white/5'
                }`}>{tab.icon}</span>
                {tab.label}
                {active && (
                  <span className="absolute -top-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 shadow shadow-indigo-400/40" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default TabBar;