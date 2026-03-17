'use client'

import { AnalysisStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Download, Cpu, BarChart3, Database,
  Github, CheckCircle2, Loader2, Circle,
} from 'lucide-react'

interface TimelineStep {
  status: AnalysisStatus
  label: string
  sublabel: string
  icon: React.ElementType
}

const STEPS: TimelineStep[] = [
  { status: 'fetching_bytecode', label: 'Fetch Bytecode',       sublabel: 'Connecting to public RPC',              icon: Download  },
  { status: 'disassembling',    label: 'Disassemble EVM',       sublabel: 'Mapping opcodes + stripping CBOR',      icon: Cpu       },
  { status: 'vectorizing',      label: 'Generate Fingerprint',  sublabel: 'Building 256-dim frequency vector',     icon: BarChart3 },
  { status: 'matching',         label: 'Vector Search',         sublabel: 'Cosine similarity via pgvector',        icon: Database  },
  { status: 'enriching',        label: 'OSINT Enrichment',      sublabel: 'Querying GitHub API',                   icon: Github    },
]

const STATUS_ORDER: AnalysisStatus[] = [
  'idle', 'fetching_bytecode', 'disassembling',
  'vectorizing', 'matching', 'enriching', 'complete', 'error',
]

function getStepState(
  stepStatus: AnalysisStatus,
  currentStatus: AnalysisStatus
): 'complete' | 'active' | 'pending' | 'error' {
  const stepIdx    = STATUS_ORDER.indexOf(stepStatus)
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)

  if (currentStatus === 'complete') return 'complete'
  if (currentStatus === 'error') {
    if (stepIdx < currentIdx) return 'complete'
    if (stepIdx === currentIdx) return 'error'
    return 'pending'
  }
  if (stepIdx < currentIdx) return 'complete'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

interface AnalysisTimelineProps {
  status: AnalysisStatus
  errorMessage?: string
}

export default function AnalysisTimeline({ status, errorMessage }: AnalysisTimelineProps) {
  if (status === 'idle') return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="relative">
        {/* Vertical connector */}
        <div className="absolute left-4 top-5 bottom-5 w-px bg-zinc-800" />

        <div className="space-y-1">
          {STEPS.map((step) => {
            const state = getStepState(step.status, status)

            return (
              <div key={step.status} className="relative flex items-start gap-4 py-2">
                {/* Node */}
                <div className={cn(
                  'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-500',
                  state === 'complete' && 'bg-emerald-500/20 border-emerald-500/60',
                  state === 'active'   && 'bg-indigo-500/20 border-indigo-500/80 ring-2 ring-indigo-500/30',
                  state === 'pending'  && 'bg-zinc-800/80 border-zinc-700/50',
                  state === 'error'    && 'bg-red-500/20 border-red-500/60',
                )}>
                  {state === 'complete' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {state === 'active'   && <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />}
                  {state === 'pending'  && <Circle className="h-3 w-3 text-zinc-600" />}
                  {state === 'error'    && <span className="text-red-400 text-xs font-bold">!</span>}
                </div>

                {/* Labels */}
                <div className="pt-0.5 min-w-0">
                  <p className={cn(
                    'text-sm font-medium transition-colors duration-300',
                    state === 'complete' && 'text-emerald-400',
                    state === 'active'   && 'text-white',
                    state === 'pending'  && 'text-zinc-600',
                    state === 'error'    && 'text-red-400',
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    'text-xs transition-colors duration-300',
                    state === 'active' ? 'text-zinc-400' : 'text-zinc-600'
                  )}>
                    {step.sublabel}
                  </p>
                </div>

                {/* Active pulse dot */}
                {state === 'active' && (
                  <div className="ml-auto pr-1 pt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error block */}
      {status === 'error' && errorMessage && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300 hex-address">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}