'use client'

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import {
  Shield, Search, AlertTriangle, Github,
  Crosshair, Activity, Database, ExternalLink,
} from 'lucide-react'
import ChainSelector from '@/components/ChainSelector'
import AnalysisTimeline from '@/components/AnalysisTimeline'
import OsintResults from '@/components/OsintResults'
import {
  SUPPORTED_CHAINS, ChainConfig, AnalysisStatus,
  RISK_CONFIG, SimilarityMatch, classifyRisk, ContractFingerprint,
} from '@/lib/types'
import { cn, truncateAddress, formatSimilarity } from '@/lib/utils'
import { fetchBytecode } from '@/lib/bytecodeFecher'
import { disassemble } from '@/lib/disassembler'
import { findSimilarContracts, saveContractFingerprint } from '@/lib/matcher'
import { runOsintEnrichment, GitHubSearchResult } from '@/lib/osint'

// ─── Full Pipeline Hook ───────────────────────────────────────────────────────

function useLoomGuard() {
  const [status, setStatus]           = useState<AnalysisStatus>('idle')
  const [error, setError]             = useState<string>()
  const [fingerprint, setFingerprint] = useState<ContractFingerprint | null>(null)
  const [matches, setMatches]         = useState<SimilarityMatch[]>([])
  const [osintResults, setOsintResults] = useState<GitHubSearchResult[]>([])
  const [matchMs, setMatchMs]         = useState<number>(0)

  const analyze = useCallback(async (address: string, chain: ChainConfig) => {
    setStatus('fetching_bytecode')
    setError(undefined)
    setFingerprint(null)
    setMatches([])
    setOsintResults([])
    setMatchMs(0)

    try {
      // ── Phase 3: Fetch bytecode ───────────────────────────────────
      const bytecodeResult = await fetchBytecode(address, chain)

      // ── Phase 4: Disassemble + vectorize ─────────────────────────
      setStatus('disassembling')
      const disassembly = disassemble(bytecodeResult.raw)

      setStatus('vectorizing')
      await new Promise((r) => setTimeout(r, 50))

      // ── Phase 5: pgvector similarity search ──────────────────────
      setStatus('matching')
      const matchResult = await findSimilarContracts(disassembly.vector, {
        threshold: 0.75,
        limit: 5,
      })
      setMatchMs(matchResult.executionTimeMs)
      setMatches(matchResult.matches)

      // ── Phase 6: GitHub OSINT enrichment ─────────────────────────
      setStatus('enriching')
      const osint = await runOsintEnrichment({
        compilerVersion: disassembly.cbor.compilerVersion,
        ipfsHash:        disassembly.cbor.ipfsHash,
        deployerAddress: bytecodeResult.deployerAddress,
      })
      setOsintResults(osint)

      setStatus('complete')

      // Build final fingerprint
      const fp: ContractFingerprint = {
        contractAddress:   address,
        chainId:           chain.id,
        chainName:         chain.name,
        rawBytecodeHash:   ethers.keccak256(bytecodeResult.raw),
        bytecodeLength:    bytecodeResult.length,
        compilerVersion:   disassembly.cbor.compilerVersion ?? 'Unknown',
        cborMetadata:      disassembly.cbor,
        opcodeVector:      disassembly.vector,
        opcodeFrequencies: disassembly.frequencies,
        deployerAddress:   bytecodeResult.deployerAddress,
        analyzedAt:        new Date().toISOString(),
      }
      setFingerprint(fp)

      // Save to DB (background, non-blocking)
      saveContractFingerprint({
        contractAddress:   address,
        chainId:           chain.id,
        chainName:         chain.name,
        compilerVersion:   disassembly.cbor.compilerVersion,
        cborMetadata:      disassembly.cbor,
        opcodeVector:      disassembly.vector,
        opcodeFrequencies: disassembly.frequencies,
        deployerAddress:   bytecodeResult.deployerAddress,
        // Save first OSINT result if high-confidence
        ...(osint[0]?.confidence === 'high' && {
          githubUsername: osint[0].username,
        }),
      }).catch(console.warn)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
      setStatus('error')
    }
  }, [])

  return { status, error, fingerprint, matches, osintResults, matchMs, analyze }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string | number
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-semibold text-zinc-300 ml-auto hex-address">{value}</span>
    </div>
  )
}

function MatchCard({ match }: { match: SimilarityMatch }) {
  const risk = classifyRisk(match.similarity)
  const config = RISK_CONFIG[risk]
  return (
    <div className={cn('rounded-xl border p-4 transition-all hover:scale-[1.01]', config.bg, config.border)}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-bold tracking-wider px-2 py-0.5 rounded border', config.color, config.bg, config.border)}>
              {config.label}
            </span>
            <span className="text-xs text-zinc-500">{match.chain_name}</span>
          </div>
          <p className="mt-1.5 font-mono text-sm text-zinc-300 truncate">
            {truncateAddress(match.contract_address, 10)}
          </p>
          {match.notes && <p className="mt-1 text-xs text-zinc-500 italic">{match.notes}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className={cn('text-2xl font-bold tabular-nums', config.color)}>
            {formatSimilarity(match.similarity)}
          </p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">similarity</p>
        </div>
      </div>
      {match.tags && match.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">{tag}</span>
          ))}
        </div>
      )}
      {match.github_username && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <Github className="h-3.5 w-3.5" />
          <a
            href={`https://github.com/${match.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white underline underline-offset-2"
          >
            @{match.github_username}
          </a>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </div>
      )}
    </div>
  )
}

function FingerprintPanel({ fp }: { fp: ContractFingerprint }) {
  const topOpcodes = Object.entries(fp.opcodeFrequencies)
    .sort(([, a], [, b]) => b - a).slice(0, 8)
  const maxCount = topOpcodes[0]?.[1] ?? 1

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-indigo-400" />
        Bytecode Fingerprint
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBadge icon={Database} label="Bytecode Size" value={`${fp.bytecodeLength} bytes`} />
        <StatBadge icon={Crosshair} label="Compiler" value={fp.compilerVersion ?? 'Unknown'} />
      </div>
      {fp.deployerAddress && (
        <div className="mb-4">
          <StatBadge icon={ExternalLink} label="Deployer" value={truncateAddress(fp.deployerAddress, 10)} />
        </div>
      )}
      {fp.cborMetadata?.ipfsHash && (
        <div className="mb-4">
          <StatBadge icon={Database} label="IPFS Hash" value={fp.cborMetadata.ipfsHash.slice(0, 20) + '...'} />
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Top Opcode Frequencies</p>
        {topOpcodes.map(([opcode, count]) => (
          <div key={opcode} className="flex items-center gap-2">
            <span className="w-20 text-[10px] font-mono text-zinc-500 text-right flex-shrink-0">{opcode}</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500/70 transition-all duration-700"
                style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
            <span className="w-10 text-[10px] font-mono text-zinc-500 tabular-nums">{count}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-zinc-950/60 border border-zinc-800 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Bytecode Hash</p>
        <p className="text-[11px] font-mono text-zinc-500 break-all">{fp.rawBytecodeHash}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [address, setAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(SUPPORTED_CHAINS[0])
  const { status, error, fingerprint, matches, osintResults, matchMs, analyze } = useLoomGuard()

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(address.trim())
  const isRunning = !['idle', 'complete', 'error'].includes(status)
  const riskLevel = classifyRisk(matches[0]?.similarity)
  const riskConfig = RISK_CONFIG[riskLevel]

  const handleSubmit = () => {
    if (!isValidAddress || isRunning) return
    analyze(address.trim(), selectedChain)
  }

  return (
    <main className="min-h-screen grid-bg relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute top-1/3 -left-20 h-60 w-60 rounded-full bg-purple-600/8 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 md:py-20">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-6">
            <Shield className="h-3.5 w-3.5" />
            EVM Bytecode Threat Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-white">Loom</span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Guard</span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Track malicious smart contract developers across chains using{' '}
            <span className="text-indigo-300 font-medium">bytecode stylometry</span> — not token trails.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['256-dim opcode vectors','Cosine similarity search','CBOR metadata extraction','GitHub OSINT bridge'].map((f) => (
              <span key={f} className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-700/60 bg-zinc-800/50 text-zinc-400">{f}</span>
            ))}
          </div>
        </div>

        {/* Search Panel */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-sm p-6 shadow-2xl">
          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2.5 font-medium">Blockchain</label>
            <ChainSelector selected={selectedChain} onChange={setSelectedChain} disabled={isRunning} />
          </div>
          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2.5 font-medium">Contract Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Crosshair className={cn('h-4 w-4 transition-colors', isValidAddress ? 'text-indigo-400' : 'text-zinc-600')} />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                spellCheck={false}
                disabled={isRunning}
                className={cn(
                  'w-full rounded-xl border bg-zinc-950/80 py-3.5 pl-11 pr-4 hex-address',
                  'text-sm text-zinc-200 placeholder:text-zinc-700 outline-none transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isValidAddress
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/20'
                    : 'border-zinc-700/60 focus:border-zinc-600'
                )}
              />
              {address.length > 0 && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <span className={cn('h-2 w-2 rounded-full', isValidAddress ? 'bg-emerald-500' : 'bg-red-500/60')} />
                </div>
              )}
            </div>
            {address.length > 0 && !isValidAddress && (
              <p className="mt-1.5 text-xs text-red-400/80 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Must be a valid 42-character hex address
              </p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValidAddress || isRunning}
            className={cn(
              'w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200',
              'flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
              isValidAddress && !isRunning
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01]'
                : 'bg-zinc-800 text-zinc-500'
            )}
          >
            {isRunning ? (
              <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Analyzing...</>
            ) : (
              <><Search className="h-4 w-4" />Analyze Contract</>
            )}
          </button>
        </div>

        {/* Timeline */}
        <AnalysisTimeline status={status} errorMessage={error} />

        {/* Results */}
        {status === 'complete' && fingerprint && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Risk banner */}
            <div className={cn('rounded-xl border p-4 flex items-center justify-between gap-4', riskConfig.bg, riskConfig.border)}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', riskConfig.color)} />
                <div>
                  <p className={cn('text-sm font-bold', riskConfig.color)}>{riskConfig.label}</p>
                  <p className="text-xs text-zinc-500">{riskConfig.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">Matches Found</p>
                <p className={cn('text-xl font-bold tabular-nums', riskConfig.color)}>{matches.length}</p>
                {matchMs > 0 && <p className="text-[10px] text-zinc-600">{matchMs}ms query</p>}
              </div>
            </div>

            {/* Fingerprint panel */}
            <FingerprintPanel fp={fingerprint} />

            {/* Vector matches */}
            {matches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Similar Contracts ({matches.length})
                </h3>
                {matches.map((match) => <MatchCard key={match.id} match={match} />)}
              </div>
            )}

            {/* GitHub OSINT */}
            <OsintResults results={osintResults} />

            {/* Empty state */}
            {matches.length === 0 && osintResults.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
                <Database className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No matching fingerprints found in the database.</p>
                <p className="text-xs text-zinc-600 mt-1">Contract fingerprinted and saved for future comparisons.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-zinc-700 space-y-1">
          <p>LoomGuard · Open Source Intelligence · All processing runs in your browser</p>
          <p>No backend · No tracking · $0 running cost</p>
        </footer>
      </div>
    </main>
  )
}