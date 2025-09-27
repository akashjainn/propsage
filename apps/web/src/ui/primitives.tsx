"use client";
import React from 'react';
import { classes } from './theme';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className='', ...rest }) => (
  <div className={`${classes.card} ${className}`} {...rest} />
);

export const CTAButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className='', children, ...rest }) => (
  <button className={`${classes.button} ${classes.focusRing} ${className}`} {...rest}>{children}</button>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'default'|'emerald'|'sky' } & React.HTMLAttributes<HTMLSpanElement>> = ({ children, color='default', className='', ...rest }) => {
  const palette = {
    default: 'bg-white/5 text-white/70 border-white/10',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-400/30'
  }[color];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${palette} ${className}`}{...rest}>{children}</span>;
};

export const StatCard: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <Card className="p-4 flex flex-col justify-center text-center border-white/10">
    <div className="text-xs tracking-wide text-white/50 uppercase mb-1">{label}</div>
    <div className={`text-2xl font-bold tabular-nums ${accent || 'text-white'}`}>{value}</div>
  </Card>
);
