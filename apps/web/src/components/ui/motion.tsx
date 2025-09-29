'use client';

import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  hoverElevate, 
  hoverScale, 
  springGentle, 
  easeOut,
  isReducedMotion,
  fadeInUp,
  staggerItem,
  useCountUp
} from '@/lib/motion';

// Base motion card with Apple-style hover effects
interface HoverCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  elevated?: boolean;
  disabled?: boolean;
}

export function HoverCard({ 
  children, 
  elevated = false, 
  disabled = false, 
  className, 
  ...props 
}: HoverCardProps) {
  const variants = elevated ? hoverElevate : hoverScale;
  
  return (
    <motion.div
      variants={disabled || isReducedMotion() ? {} : variants}
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'rounded-2xl glass light-edge transition-all duration-200',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated list container with stagger
interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export function AnimatedList({ children, className, stagger = 0.06 }: AnimatedListProps) {
  return (
    <motion.div
      variants={{
        animate: {
          transition: {
            staggerChildren: isReducedMotion() ? 0 : stagger,
          },
        },
      }}
      initial="initial"
      animate="animate"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={easeOut}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Drawer component with spring physics
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Drawer({ isOpen, onClose, children, title, className }: DrawerProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={easeOut}
      className="fixed inset-0 z-[60] bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.6 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32
        }}
        className={cn(
          "absolute right-0 top-0 h-full w-full sm:w-[520px] glass-strong shadow-[0_-12px_64px_rgba(0,0,0,.5)] overflow-y-auto",
          "rounded-t-2xl sm:rounded-none",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="h-1.5 w-14 rounded-full bg-white/20" />
        </div>
        {title && (
          <div className="sticky top-0 z-10 glass-strong border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {!title && (
          <div className="flex justify-end p-2 sm:hidden">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md bg-white/10 text-white/70 hover:bg-white/20"
            >Close</button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Animated percentage display with count-up
interface AnimatedPercentageProps {
  value: number;
  className?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedPercentage({ 
  value, 
  className, 
  suffix = '%', 
  decimals = 1 
}: AnimatedPercentageProps) {
  const animatedValue = useCountUp(
    value, 
    600, 
    (n) => `${n.toFixed(decimals)}${suffix}`
  );
  
  const isPositive = value >= 0;
  
  return (
    <span 
      className={cn(
        'font-bold tabular-nums',
        isPositive ? 'text-green-400' : 'text-red-400',
        className
      )}
    >
      {isPositive ? '+' : ''}{animatedValue}
    </span>
  );
}

// Loading skeleton with Apple News style
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar';
}

export function Skeleton({ className, variant = 'card' }: SkeletonProps) {
  const baseStyles = "animate-pulse bg-white/10 rounded-xl";
  
  const variants = {
    text: "h-4 w-full",
    card: "h-32 w-full",
    avatar: "h-10 w-10 rounded-full",
  };

  return (
    <div 
      className={cn(baseStyles, variants[variant], className)} 
      aria-label="Loading..."
    />
  );
}

// Spotlight effect for highlighting elements
interface SpotlightProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Spotlight({ isActive, children, className }: SpotlightProps) {
  return (
    <motion.div
      animate={{
        boxShadow: isActive 
          ? "0 0 0 2px rgba(34, 199, 245, 0.6), 0 0 20px rgba(34, 199, 245, 0.3)"
          : "none",
        scale: isActive ? 1.02 : 1,
      }}
      transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      className={cn("transition-all duration-600", className)}
    >
      {children}
    </motion.div>
  );
}

// Glass overlay for modals and command palettes
interface GlassOverlayProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function GlassOverlay({ isOpen, children, className, onClose }: GlassOverlayProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={easeOut}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 32
        }}
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-strong rounded-3xl max-w-2xl w-full mx-4",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}