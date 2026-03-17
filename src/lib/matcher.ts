import { supabase } from './supabase'
import { SimilarityMatch } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchOptions {
  threshold?: number   // minimum similarity 0.0–1.0 (default 0.75)
  limit?: number       // max results to return (default 5)
  chainId?: number     // optional: restrict to one chain
}

export interface MatchResult {
  matches: SimilarityMatch[]
  queryVector: number[]
  executionTimeMs: number
}

// ─── Format vector for Postgres ──────────────────────────────────────────────
// pgvector expects the format: '[0.1,0.2,0.3,...]'

function formatVectorForPostgres(vector: number[]): string {
  // Round to 6 decimal places to keep payload size reasonable
  const rounded = vector.map((v) => Math.round(v * 1_000_000) / 1_000_000)
  return `[${rounded.join(',')}]`
}

// ─── Main similarity search ───────────────────────────────────────────────────

export async function findSimilarContracts(
  vector: number[],
  options: MatchOptions = {}
): Promise<MatchResult> {
  const {
    threshold = 0.75,
    limit = 5,
    chainId,
  } = options

  if (vector.length !== 256) {
    throw new Error(`Vector must be 256 dimensions, got ${vector.length}`)
  }

  const startTime = performance.now()

  // Call the RPC function we created in Phase 1
  const { data, error } = await supabase.rpc('match_contract_signatures', {
    query_vector: formatVectorForPostgres(vector),
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    throw new Error(`pgvector search failed: ${error.message}`)
  }

  const executionTimeMs = Math.round(performance.now() - startTime)

  // Filter by chain if requested (done client-side since our SQL fn doesn't have that param)
  let matches: SimilarityMatch[] = (data ?? []) as SimilarityMatch[]
  if (chainId !== undefined) {
    matches = matches.filter((m) => m.chain_id === chainId)
  }

  return { matches, queryVector: vector, executionTimeMs }
}

// ─── Save new fingerprint to DB ───────────────────────────────────────────────
// Called after analysis so future searches can match against this contract

export async function saveContractFingerprint(params: {
  contractAddress:   string
  chainId:           number
  chainName:         string
  compilerVersion?:  string
  optimizerEnabled?: boolean
  cborMetadata?:     object
  opcodeVector:      number[]
  opcodeFrequencies: Record<string, number>
  deployerAddress?:  string
  githubUsername?:   string
}): Promise<{ id: string } | null> {

  // Check if already exists (avoid duplicate submissions)
  const { data: existing } = await supabase
    .from('contract_signatures')
    .select('id')
    .eq('contract_address', params.contractAddress.toLowerCase())
    .eq('chain_id', params.chainId)
    .maybeSingle()

  if (existing) {
    console.log('Contract already in DB:', existing.id)
    return existing as { id: string }
  }

  const { data, error } = await supabase
    .from('contract_signatures')
    .insert({
      contract_address:   params.contractAddress.toLowerCase(),
      chain_id:           params.chainId,
      chain_name:         params.chainName,
      compiler_version:   params.compilerVersion,
      optimizer_enabled:  params.optimizerEnabled,
      cbor_metadata:      params.cborMetadata ?? {},
      opcode_vector:      formatVectorForPostgres(params.opcodeVector),
      opcode_frequencies: params.opcodeFrequencies,
      deployer_address:   params.deployerAddress?.toLowerCase(),
      github_username:    params.githubUsername,
      submitted_by:       'loomguard-client',
    })
    .select('id')
    .single()

  if (error) {
    // Non-fatal — log but don't crash the UI
    console.warn('Failed to save fingerprint:', error.message)
    return null
  }

  return data as { id: string }
}