'use client'

import { ChainConfig, SUPPORTED_CHAINS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChainSelectorProps {
  selected: ChainConfig
  onChange: (chain: ChainConfig) => void
  disabled?: boolean
}

export default function ChainSelector({
  selected,
  onChange,
  disabled = false,
}: ChainSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUPPORTED_CHAINS.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onChange(chain)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-semibold border transition-all duration-200',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            selected.id === chain.id
              ? cn(chain.color, 'ring-1 ring-current scale-105')
              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:border-zinc-500'
          )}
        >
          {chain.label}
        </button>
      ))}
    </div>
  )
}