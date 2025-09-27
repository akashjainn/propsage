import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

export function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Custom P Logo - Using CSS to create the gradient P */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 via-orange-500 via-purple-500 to-blue-500 p-0.5">
          <div className="h-full w-full rounded-xl bg-black flex items-center justify-center">
            <div className="text-white font-black text-lg tracking-tight">P</div>
          </div>
        </div>
        {/* Add some glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500/20 via-red-500/20 via-orange-500/20 via-purple-500/20 to-blue-500/20 blur-sm -z-10" />
      </div>
      
      {showText && (
        <span className="text-xl font-semibold tracking-tight text-[var(--fg)]">
          PropSage
        </span>
      )}
    </div>
  )
}

export default Logo
