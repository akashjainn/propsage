'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { usePropAnalysis } from '@/contexts/PropAnalysisContext'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { fadeInUp } from '@/lib/motion'

export function Header() {
  const { state: wsState } = useWebSocket()
  const { state } = usePropAnalysis()

  return (
    <motion.header 
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="sticky top-0 z-40 glass-strong border-b border-white/10"
    >
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-brand p-[1px] shadow-brand-glow animate-brand-pulse">
              <div className="h-full w-full rounded-[11px] bg-[var(--card)] flex items-center justify-center">
                <Image
                  src="/icon-512.png"
                  alt="PropSage"
                  width={32}
                  height={32}
                  className="w-5 h-5 object-contain"
                  priority
                  unoptimized
                  onError={(e) => {
                    console.error('Failed to load new logo, falling back to favicon:', e);
                    e.currentTarget.src = '/favicon-32.png';
                  }}
                  onLoad={() => {
                    console.log('✅ New brand logo loaded successfully');
                  }}
                />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient">
              PropSage
            </span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-3 text-sm text-white/70">
            <span className="font-medium">Enterprise Sports Intelligence</span>
            <motion.span 
              className="px-3 py-1.5 rounded-full accent-bg accent text-xs font-semibold accent-ring ring-1"
              animate={{ 
                boxShadow: [
                  "0 0 0 1px rgba(var(--accent-rgb), 0.3)",
                  "0 0 0 1px rgba(var(--accent-rgb), 0.5), 0 0 15px rgba(var(--accent-rgb), 0.2)",
                  "0 0 0 1px rgba(var(--accent-rgb), 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Live
            </motion.span>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/60">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div 
                className="h-2 w-2 rounded-full accent"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="font-medium">Demo Mode</span>
            </motion.div>
            <motion.div 
              className="px-2 py-1 rounded-md glass-subtle font-medium tabular-nums"
              whileHover={{ 
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                scale: 1.05 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              Analyses: {state.analyses.length}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
