import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address || address.length < 12) return address
  return `${address.slice(0, chars)}...${address.slice(-4)}`
}

export function formatSimilarity(similarity: number): string {
  return `${(similarity * 100).toFixed(1)}%`
}