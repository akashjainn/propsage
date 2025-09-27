export const tokens = {
  bg: 'radial-gradient(1200px 600px at 20% -10%, rgba(64,149,255,.08), transparent), radial-gradient(1000px 500px at 80% 10%, rgba(233,196,106,.06), transparent), #0a0f1a',
  card: 'rgba(255,255,255,.04)',
  stroke: 'rgba(255,255,255,.07)',
  glow: '0 10px 30px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)',
  focus: '0 0 0 2px rgba(123,176,255,.60), 0 0 0 6px rgba(123,176,255,.18)',
  radius: { xl: '1.25rem', '2xl': '1.75rem' }
};

export const classes = {
  card: 'rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,.4)]',
  pill: 'rounded-full bg-white/5 border border-white/10 text-white/80 px-2.5 py-1 text-xs font-medium',
  button: 'rounded-2xl border border-white/10 bg-white/[0.05] hover:border-white/20 active:scale-[.98] transition shadow-[0_10px_30px_rgba(0,0,0,.4)] px-4 h-11 flex items-center gap-2 text-sm font-medium',
  focusRing: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70'
};
