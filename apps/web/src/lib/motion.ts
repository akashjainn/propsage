import { Variants, Transition } from 'framer-motion';

// Apple-inspired spring configurations
export const springSnappy = { type: "spring", stiffness: 380, damping: 32 } as const;
export const springSoft = { type: "spring", stiffness: 260, damping: 30 } as const;
export const springGentle = { type: "spring", stiffness: 200, damping: 26 } as const;

// Apple-style easing curves
export const easeOut = { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] } as const;
export const easeInOut = { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } as const;
export const easeFast = { duration: 0.12, ease: [0.22, 0.61, 0.36, 1] } as const;

// Motion durations (Apple timings)
export const durations = {
  micro: 120,
  ui: 220,
  overlay: 420,
  hero: 600,
} as const;

// Check for reduced motion preference
export const isReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: 8, transition: easeOut },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: easeOut },
  exit: { opacity: 0, transition: easeOut },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.95, transition: easeOut },
};

export const slideInFromBottom: Variants = {
  initial: { opacity: 0.6, y: "100%" },
  animate: { opacity: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0.6, y: "100%", transition: easeOut },
};

export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: "100%" },
  animate: { opacity: 1, x: 0, transition: springSnappy },
  exit: { opacity: 0, x: "100%", transition: easeOut },
};

// Stagger animations for lists
export const staggerChildren = (staggerDelay = 0.06): Variants => ({
  animate: {
    transition: {
      staggerChildren: isReducedMotion() ? 0 : staggerDelay,
    },
  },
});

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: easeOut },
};

// Hover animations
export const hoverScale: Variants = {
  hover: { 
    scale: isReducedMotion() ? 1 : 1.02, 
    transition: springGentle 
  },
  tap: { 
    scale: isReducedMotion() ? 1 : 0.98, 
    transition: springGentle 
  },
};

export const hoverElevate: Variants = {
  hover: {
    y: isReducedMotion() ? 0 : -2,
    boxShadow: isReducedMotion() ? "none" : "0 8px 40px rgba(0,0,0,.45)",
    transition: springGentle,
  },
};

// Glass morphism animation
export const glassBlur: Variants = {
  initial: { backdropFilter: "blur(0px)", opacity: 0 },
  animate: { backdropFilter: "blur(20px)", opacity: 1, transition: easeOut },
  exit: { backdropFilter: "blur(0px)", opacity: 0, transition: easeOut },
};

// Page transition helpers
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { ...easeOut, duration: 0.3 } },
  exit: { opacity: 0, y: 8, transition: { ...easeOut, duration: 0.2 } },
};

// Custom hook for count-up animation
export const useCountUp = (
  value: number, 
  duration = 600,
  formatter?: (n: number) => string
) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (isReducedMotion()) {
      setDisplayValue(value);
      return;
    }

    const start = performance.now();
    let animationFrame = 0;

    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / duration);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      const current = value * easeOutProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return formatter ? formatter(displayValue) : displayValue;
};

import React from 'react';