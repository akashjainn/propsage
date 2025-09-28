'use client'

import React from 'react'
import Image from 'next/image'

interface LoadingIconProps {
  size?: number
  className?: string
}

export function LoadingIcon({ size = 32, className = '' }: LoadingIconProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[var(--iris)]/20 animate-ping" />
        <div className="relative h-8 w-8 rounded-full bg-[var(--iris)]/80 ring-2 ring-[var(--ring)]/40 shadow-[0_0_30px_rgba(108,92,231,.45)] flex items-center justify-center overflow-hidden">
          <Image
            src="/icon.png"
            alt="PropSage"
            width={size * 0.75}
            height={size * 0.75}
            className="object-contain animate-pulse"
            priority
          />
        </div>
      </div>
    </div>
  )
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingIcon size={48} />
      <div className="text-[var(--fg-dim)] text-sm animate-pulse">
        {message}
      </div>
    </div>
  )
}