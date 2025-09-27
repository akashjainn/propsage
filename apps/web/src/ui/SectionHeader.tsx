"use client";
import React from 'react';

interface SectionHeaderProps { title: string; subtitle?: string; action?: React.ReactNode; }
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps){
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1 min-w-0">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-white/70 text-sm md:text-base leading-snug max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
