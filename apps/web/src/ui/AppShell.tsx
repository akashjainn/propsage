"use client";
import React from 'react';
import Image from 'next/image';
import { tokens } from './theme';

function Logo(){
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 ring-2 ring-indigo-400/50 shadow-[0_0_25px_rgba(99,102,241,.4)] flex items-center justify-center overflow-hidden relative group hover:scale-105 transition-all duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <Image
          src="/favicon-32.png"
          alt="PropSage"
          width={32}
          height={32}
          className="w-7 h-7 object-contain relative z-10 drop-shadow-sm"
          priority
          unoptimized
          onError={() => console.error('AppShell Logo failed to load favicon-32.png')}
          onLoad={() => console.log('✅ AppShell Logo loaded favicon-32.png successfully')}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-white">PropSage</span>
        <span className="text-xs text-white/60 font-medium -mt-0.5">Sports Intelligence</span>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh text-slate-100" style={{ background: tokens.bg }}>
      <div className="bg-grid/30 min-h-dvh relative">
        <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-[#0b1420]/80">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/70">Live Analysis</span>
              </div>
              <div className="text-white/60 font-medium">Market · Video Intelligence</div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
