'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUpIcon } from 'lucide-react';
import { easeOut, springGentle } from '@/lib/motion';

interface ThemeColor {
  name: string;
  rgb: string;
  preview: string;
}

const themes: ThemeColor[] = [
  { name: 'Mint', rgb: '53, 224, 161', preview: 'rgb(53, 224, 161)' },
  { name: 'Electric Blue', rgb: '58, 161, 255', preview: 'rgb(58, 161, 255)' },
  { name: 'Purple', rgb: '147, 51, 234', preview: 'rgb(147, 51, 234)' },
  { name: 'Orange', rgb: '251, 146, 60', preview: 'rgb(251, 146, 60)' },
  { name: 'Pink', rgb: '236, 72, 153', preview: 'rgb(236, 72, 153)' },
  { name: 'Cyan', rgb: '34, 211, 238', preview: 'rgb(34, 211, 238)' },
];

export function ThemePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  const changeTheme = (theme: ThemeColor) => {
    setCurrentTheme(theme);
    document.documentElement.style.setProperty('--accent-rgb', theme.rgb);
    setIsOpen(false);
  };

  // Only show in development mode
  if (!isDev) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={springGentle}
            className="absolute bottom-16 right-0 glass-strong rounded-2xl p-3 shadow-2xl border border-white/20"
          >
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <motion.button
                  key={theme.name}
                  onClick={() => changeTheme(theme)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 ${
                    currentTheme.name === theme.name
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{
                    backgroundColor: theme.preview,
                    boxShadow: currentTheme.name === theme.name 
                      ? `0 0 20px ${theme.preview}60` 
                      : 'none'
                  }}
                  whileHover={{ scale: currentTheme.name === theme.name ? 1.1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springGentle}
                  title={`Switch to ${theme.name} theme`}
                />
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-white/60 text-center font-medium">
                Theme Picker
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full glass-strong border border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springGentle}
        title="Change theme accent color"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springGentle}
        >
          <ChevronUpIcon className="w-5 h-5 text-white/80" />
        </motion.div>
        
        {/* Current theme indicator */}
        <div 
          className="absolute inset-1 rounded-full border-2 border-white/30 -z-10"
          style={{
            backgroundColor: currentTheme.preview + '20',
            boxShadow: `inset 0 0 10px ${currentTheme.preview}40`
          }}
        />
      </motion.button>
    </div>
  );
}

// Hook for using theme in components
export function useTheme() {
  const [currentRgb, setCurrentRgb] = useState('53, 224, 161');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const rgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-rgb')
        .trim();
      if (rgb && rgb !== currentRgb) {
        setCurrentRgb(rgb);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, [currentRgb]);

  return {
    accentRgb: currentRgb,
    accentHex: `rgb(${currentRgb})`,
    accentWithAlpha: (alpha: number) => `rgba(${currentRgb}, ${alpha})`
  };
}