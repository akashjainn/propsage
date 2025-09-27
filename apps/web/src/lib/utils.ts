import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Number formatting utilities for enterprise UI
export function formatNumber(
  value: number,
  options?: {
    style?: 'decimal' | 'currency' | 'percent'
    currency?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  const defaults = {
    style: 'decimal' as const,
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }
  
  const config = { ...defaults, ...options }
  
  return new Intl.NumberFormat('en-US', config).format(value)
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return formatNumber(value, { style: 'currency', currency })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatEdge(value: number): string {
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

// Date/Time utilities
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// Color utilities for data visualization
export function getEdgeColor(edge: number): string {
  if (edge > 0.05) return 'var(--accent-pos)'
  if (edge > 0.02) return 'var(--warning)'
  return 'var(--accent-neg)'
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'var(--accent-pos)'
  if (change < 0) return 'var(--accent-neg)'
  return 'var(--text-secondary)'
}