import { ethers } from 'ethers'
import { ChainConfig } from './types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BytecodeResult {
  raw: string              // full hex string including 0x prefix
  length: number           // byte count (hex length / 2)
  isContract: boolean      // false = EOA wallet, not a contract
  deployerAddress?: string // address that deployed this contract
  blockDeployed?: number   // block number of deployment tx
}

export class BytecodeError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_CONTRACT'
      | 'EMPTY_BYTECODE'
      | 'RPC_ERROR'
      | 'INVALID_ADDRESS'
      | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'BytecodeError'
  }
}

// ─── RPC Fallback List (free, no API key needed) ─────────────────────────────

const RPC_FALLBACKS: Record<number, string[]> = {
  1: [
    'https://rpc.ankr.com/eth',
    'https://eth.llamarpc.com',
    'https://cloudflare-eth.com',
    'https://rpc.payload.de',
  ],
  56: [
    'https://rpc.ankr.com/bsc',
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
  ],
  137: [
    'https://rpc.ankr.com/polygon',
    'https://polygon.llamarpc.com',
    'https://polygon-rpc.com',
  ],
  42161: [
    'https://rpc.ankr.com/arbitrum',
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum.llamarpc.com',
  ],
  8453: [
    'https://rpc.ankr.com/base',
    'https://mainnet.base.org',
    'https://base.llamarpc.com',
  ],
}

// ─── Provider Factory with Fallback ──────────────────────────────────────────

async function getWorkingProvider(
  chain: ChainConfig
): Promise<ethers.JsonRpcProvider> {
  const urls = RPC_FALLBACKS[chain.id] ?? [chain.rpcUrl]

  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, chain.id, {
        staticNetwork: true, // skip eth_chainId call — faster
      })
      // Quick liveness check with 5s timeout
      const networkPromise = provider.getBlockNumber()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      )
      await Promise.race([networkPromise, timeoutPromise])
      return provider
    } catch {
      // Try next RPC
      continue
    }
  }

  throw new BytecodeError(
    `All RPC endpoints for ${chain.label} are unreachable. Try again later.`,
    'NETWORK_ERROR'
  )
}

// ─── Deployer Lookup via eth_getTransactionByHash ────────────────────────────

async function getDeployerInfo(
  provider: ethers.JsonRpcProvider,
  contractAddress: string
): Promise<{ deployer?: string; blockDeployed?: number }> {
  try {
    // Use eth_getLogs to find contract creation — works on all EVM chains
    // Filter: look for tx TO null (contract creation) in recent blocks
    // More reliable: use trace_transaction if available, else skip gracefully
    const code = await provider.getCode(contractAddress)
    if (code === '0x') return {}

    // Try to get creation tx via eth_getTransactionReceipt trick:
    // We scan for the first tx that created this address using a low-level call
    const result = await provider.send('eth_getTransactionByHash', [
      await getCreationTxHash(provider, contractAddress),
    ]).catch(() => null)

    if (result && result.from) {
      return {
        deployer: result.from,
        blockDeployed: result.blockNumber
          ? parseInt(result.blockNumber, 16)
          : undefined,
      }
    }
  } catch {
    // Deployer lookup is best-effort — don't fail the main fetch
  }
  return {}
}

async function getCreationTxHash(
  provider: ethers.JsonRpcProvider,
  contractAddress: string
): Promise<string> {
  // Use eth_getTransactionReceipt with contractAddress is not directly possible.
  // Best free approach: binary search block range for contract creation.
  // For now we use a direct trace call if available (Ankr supports this):
  const trace = await provider.send('trace_filter', [{
    fromBlock: '0x0',
    toBlock: 'latest',
    toAddress: [null],
    after: 0,
    count: 1,
  }]).catch(() => null)

  if (trace?.[0]?.transactionHash) return trace[0].transactionHash
  throw new Error('trace not available')
}

// ─── Main Exported Fetcher ────────────────────────────────────────────────────

export async function fetchBytecode(
  contractAddress: string,
  chain: ChainConfig,
  onStatus?: (msg: string) => void
): Promise<BytecodeResult> {

  // 1. Validate address format
  if (!ethers.isAddress(contractAddress)) {
    throw new BytecodeError(
      `"${contractAddress}" is not a valid EVM address.`,
      'INVALID_ADDRESS'
    )
  }

  const checksumAddress = ethers.getAddress(contractAddress) // EIP-55 checksum

  onStatus?.(`Connecting to ${chain.label} via public RPC...`)

  // 2. Get a working provider (with fallback)
  const provider = await getWorkingProvider(chain)

  onStatus?.(`Fetching bytecode for ${checksumAddress}...`)

  // 3. Fetch bytecode
  let rawBytecode: string
  try {
    rawBytecode = await provider.getCode(checksumAddress)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown RPC error'
    throw new BytecodeError(
      `RPC call failed: ${msg}`,
      'RPC_ERROR'
    )
  }

  // 4. Check if it's actually a contract (not a wallet address)
  if (rawBytecode === '0x' || rawBytecode === '') {
    throw new BytecodeError(
      `No bytecode found at ${checksumAddress} on ${chain.label}. ` +
      `This address is either a wallet (EOA) or the contract has self-destructed.`,
      'NOT_CONTRACT'
    )
  }

  // 5. Sanity check — real contracts are at least a few bytes
  const byteLength = (rawBytecode.length - 2) / 2 // subtract '0x', divide by 2
  if (byteLength < 3) {
    throw new BytecodeError(
      `Bytecode at ${checksumAddress} is unusually short (${byteLength} bytes). ` +
      `This may be a proxy stub or minimal contract.`,
      'EMPTY_BYTECODE'
    )
  }

  onStatus?.(`Bytecode retrieved — ${byteLength} bytes. Looking up deployer...`)

  // 6. Best-effort deployer lookup (non-blocking)
  const { deployer, blockDeployed } = await getDeployerInfo(
    provider,
    checksumAddress
  ).catch(() => ({ deployer: undefined, blockDeployed: undefined }))

  return {
    raw: rawBytecode,
    length: byteLength,
    isContract: true,
    deployerAddress: deployer,
    blockDeployed,
  }
}