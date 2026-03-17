// ─── Chain Configuration ────────────────────────────────────────────────────

export interface ChainConfig {
  id: number
  name: string
  label: string
  rpcUrl: string
  explorer: string
  nativeCurrency: string
  color: string
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: 'ethereum',
    label: 'Ethereum',
    rpcUrl: 'https://rpc.ankr.com/eth',
    explorer: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 56,
    name: 'bsc',
    label: 'BNB Chain',
    rpcUrl: 'https://rpc.ankr.com/bsc',
    explorer: 'https://bscscan.com',
    nativeCurrency: 'BNB',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  {
    id: 137,
    name: 'polygon',
    label: 'Polygon',
    rpcUrl: 'https://rpc.ankr.com/polygon',
    explorer: 'https://polygonscan.com',
    nativeCurrency: 'MATIC',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 42161,
    name: 'arbitrum',
    label: 'Arbitrum',
    rpcUrl: 'https://rpc.ankr.com/arbitrum',
    explorer: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    id: 8453,
    name: 'base',
    label: 'Base',
    rpcUrl: 'https://rpc.ankr.com/base',
    explorer: 'https://basescan.org',
    nativeCurrency: 'ETH',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
]

// ─── Analysis Pipeline ───────────────────────────────────────────────────────

export type AnalysisStatus =
  | 'idle'
  | 'fetching_bytecode'
  | 'disassembling'
  | 'vectorizing'
  | 'matching'
  | 'enriching'
  | 'complete'
  | 'error'

export interface OpcodeFrequencies {
  [opcode: string]: number
}

export interface CborMetadata {
  solcVersion?: string
  ipfsHash?: string
  swarmHash?: string
  raw?: string
}

export interface ContractFingerprint {
  contractAddress: string
  chainId: number
  chainName: string
  rawBytecodeHash: string
  bytecodeLength: number
  compilerVersion?: string
  optimizerEnabled?: boolean
  cborMetadata?: CborMetadata
  opcodeVector: number[]
  opcodeFrequencies: OpcodeFrequencies
  deployerAddress?: string
  analyzedAt: string
}

// ─── Database Row (matches your Supabase schema exactly) ────────────────────

export interface ContractSignatureRow {
  id: string
  contract_address: string
  chain_id: number
  chain_name: string
  compiler_version?: string
  optimizer_enabled?: boolean
  optimizer_runs?: number
  cbor_metadata?: CborMetadata
  opcode_vector?: number[]
  opcode_frequencies?: OpcodeFrequencies
  deployer_address?: string
  github_username?: string
  github_repos?: GitHubRepo[]
  tags?: string[]
  notes?: string
  submitted_by: string
  created_at: string
  updated_at: string
}

export interface SimilarityMatch extends ContractSignatureRow {
  similarity: number
}

// ─── GitHub OSINT ────────────────────────────────────────────────────────────

export interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description?: string
  stargazers_count: number
  language?: string
  created_at: string
  updated_at: string
}

export interface GitHubUser {
  login: string
  html_url: string
  avatar_url: string
  name?: string
  bio?: string
  public_repos: number
  followers: number
}

// ─── Risk Classification ─────────────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown'

export function classifyRisk(topSimilarity: number | undefined): RiskLevel {
  if (topSimilarity === undefined) return 'unknown'
  if (topSimilarity >= 0.95) return 'critical'
  if (topSimilarity >= 0.88) return 'high'
  if (topSimilarity >= 0.78) return 'medium'
  if (topSimilarity >= 0.65) return 'low'
  return 'unknown'
}

export const RISK_CONFIG: Record<RiskLevel, {
  label: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  critical: {
    label: 'CRITICAL MATCH',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    description: 'Near-identical bytecode fingerprint to a known threat actor',
  },
  high: {
    label: 'HIGH SIMILARITY',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/40',
    description: 'Strong stylometric overlap with a flagged developer',
  },
  medium: {
    label: 'MODERATE MATCH',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/40',
    description: 'Partial coding pattern overlap — warrants investigation',
  },
  low: {
    label: 'WEAK SIGNAL',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    description: 'Minor similarity detected — likely coincidental',
  },
  unknown: {
    label: 'NO MATCH',
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/30',
    description: 'No known fingerprint match found in the database',
  },
}