"use client";
import React from 'react';
import { tokens } from './theme';
import { Logo } from '@/components/Logo';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh text-slate-100" style={{ background: tokens.bg }}>
      <div className="bg-grid/30 min-h-dvh relative">
        <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Logo size="md" />
            <div className="ml-auto text-sm text-white/60">Market · Video Intelligence</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
