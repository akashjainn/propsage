"use client";
import React from 'react';
import Image from 'next/image';
import { tokens } from './theme';

function Logo(){
  return (
    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,.3)] flex items-center justify-center overflow-hidden">
      <Image
        src="/favicon-32.png"
        alt="PropSage"
        width={32}
        height={32}
        className="w-6 h-6 object-contain"
        priority
        unoptimized
        onError={() => console.error('AppShell Logo failed to load favicon-32.png')}
        onLoad={() => console.log('✅ AppShell Logo loaded favicon-32.png successfully')}
      />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh text-slate-100" style={{ background: tokens.bg }}>
      <div className="bg-grid/30 min-h-dvh relative">
        <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <Logo />
            <div className="ml-auto text-sm text-white/60">Market · Video Intelligence</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
