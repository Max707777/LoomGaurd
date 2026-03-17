// ─── EVM Opcode Table (all 256 slots) ────────────────────────────────────────
// Each entry: [mnemonic, immediate_bytes]
// immediate_bytes > 0 only for PUSH1–PUSH32

const OPCODES: Record<number, [string, number]> = {
  // ── Stop & Arithmetic ──────────────────────────────────────────────────────
  0x00: ['STOP',        0], 0x01: ['ADD',         0], 0x02: ['MUL',         0],
  0x03: ['SUB',         0], 0x04: ['DIV',         0], 0x05: ['SDIV',        0],
  0x06: ['MOD',         0], 0x07: ['SMOD',        0], 0x08: ['ADDMOD',      0],
  0x09: ['MULMOD',      0], 0x0a: ['EXP',         0], 0x0b: ['SIGNEXTEND',  0],

  // ── Comparison & Bitwise ───────────────────────────────────────────────────
  0x10: ['LT',          0], 0x11: ['GT',          0], 0x12: ['SLT',         0],
  0x13: ['SGT',         0], 0x14: ['EQ',          0], 0x15: ['ISZERO',      0],
  0x16: ['AND',         0], 0x17: ['OR',          0], 0x18: ['XOR',         0],
  0x19: ['NOT',         0], 0x1a: ['BYTE',        0], 0x1b: ['SHL',         0],
  0x1c: ['SHR',         0], 0x1d: ['SAR',         0],

  // ── SHA3 ───────────────────────────────────────────────────────────────────
  0x20: ['SHA3',        0],

  // ── Environmental ─────────────────────────────────────────────────────────
  0x30: ['ADDRESS',     0], 0x31: ['BALANCE',     0], 0x32: ['ORIGIN',      0],
  0x33: ['CALLER',      0], 0x34: ['CALLVALUE',   0], 0x35: ['CALLDATALOAD',0],
  0x36: ['CALLDATASIZE',0], 0x37: ['CALLDATACOPY',0], 0x38: ['CODESIZE',    0],
  0x39: ['CODECOPY',    0], 0x3a: ['GASPRICE',    0], 0x3b: ['EXTCODESIZE', 0],
  0x3c: ['EXTCODECOPY', 0], 0x3d: ['RETURNDATASIZE',0],0x3e:['RETURNDATACOPY',0],
  0x3f: ['EXTCODEHASH', 0],

  // ── Block ─────────────────────────────────────────────────────────────────
  0x40: ['BLOCKHASH',   0], 0x41: ['COINBASE',    0], 0x42: ['TIMESTAMP',   0],
  0x43: ['NUMBER',      0], 0x44: ['DIFFICULTY',  0], 0x45: ['GASLIMIT',    0],
  0x46: ['CHAINID',     0], 0x47: ['SELFBALANCE', 0], 0x48: ['BASEFEE',     0],

  // ── Memory / Storage / Flow ───────────────────────────────────────────────
  0x50: ['POP',         0], 0x51: ['MLOAD',       0], 0x52: ['MSTORE',      0],
  0x53: ['MSTORE8',     0], 0x54: ['SLOAD',       0], 0x55: ['SSTORE',      0],
  0x56: ['JUMP',        0], 0x57: ['JUMPI',       0], 0x58: ['PC',          0],
  0x59: ['MSIZE',       0], 0x5a: ['GAS',         0], 0x5b: ['JUMPDEST',    0],

  // ── PUSH (PUSH1–PUSH32) ───────────────────────────────────────────────────
  0x60: ['PUSH1',  1],  0x61: ['PUSH2',  2],  0x62: ['PUSH3',  3],
  0x63: ['PUSH4',  4],  0x64: ['PUSH5',  5],  0x65: ['PUSH6',  6],
  0x66: ['PUSH7',  7],  0x67: ['PUSH8',  8],  0x68: ['PUSH9',  9],
  0x69: ['PUSH10',10],  0x6a: ['PUSH11',11],  0x6b: ['PUSH12',12],
  0x6c: ['PUSH13',13],  0x6d: ['PUSH14',14],  0x6e: ['PUSH15',15],
  0x6f: ['PUSH16',16],  0x70: ['PUSH17',17],  0x71: ['PUSH18',18],
  0x72: ['PUSH19',19],  0x73: ['PUSH20',20],  0x74: ['PUSH21',21],
  0x75: ['PUSH22',22],  0x76: ['PUSH23',23],  0x77: ['PUSH24',24],
  0x78: ['PUSH25',25],  0x79: ['PUSH26',26],  0x7a: ['PUSH27',27],
  0x7b: ['PUSH28',28],  0x7c: ['PUSH29',29],  0x7d: ['PUSH30',30],
  0x7e: ['PUSH31',31],  0x7f: ['PUSH32',32],

  // ── DUP (DUP1–DUP16) ─────────────────────────────────────────────────────
  0x80: ['DUP1',  0], 0x81: ['DUP2',  0], 0x82: ['DUP3',  0], 0x83: ['DUP4',  0],
  0x84: ['DUP5',  0], 0x85: ['DUP6',  0], 0x86: ['DUP7',  0], 0x87: ['DUP8',  0],
  0x88: ['DUP9',  0], 0x89: ['DUP10', 0], 0x8a: ['DUP11', 0], 0x8b: ['DUP12', 0],
  0x8c: ['DUP13', 0], 0x8d: ['DUP14', 0], 0x8e: ['DUP15', 0], 0x8f: ['DUP16', 0],

  // ── SWAP (SWAP1–SWAP16) ───────────────────────────────────────────────────
  0x90: ['SWAP1',  0], 0x91: ['SWAP2',  0], 0x92: ['SWAP3',  0], 0x93: ['SWAP4',  0],
  0x94: ['SWAP5',  0], 0x95: ['SWAP6',  0], 0x96: ['SWAP7',  0], 0x97: ['SWAP8',  0],
  0x98: ['SWAP9',  0], 0x99: ['SWAP10', 0], 0x9a: ['SWAP11', 0], 0x9b: ['SWAP12', 0],
  0x9c: ['SWAP13', 0], 0x9d: ['SWAP14', 0], 0x9e: ['SWAP15', 0], 0x9f: ['SWAP16', 0],

  // ── LOG ───────────────────────────────────────────────────────────────────
  0xa0: ['LOG0', 0], 0xa1: ['LOG1', 0], 0xa2: ['LOG2', 0],
  0xa3: ['LOG3', 0], 0xa4: ['LOG4', 0],

  // ── System ────────────────────────────────────────────────────────────────
  0xf0: ['CREATE',       0], 0xf1: ['CALL',         0], 0xf2: ['CALLCODE',    0],
  0xf3: ['RETURN',       0], 0xf4: ['DELEGATECALL', 0], 0xf5: ['CREATE2',     0],
  0xfa: ['STATICCALL',   0], 0xfd: ['REVERT',       0], 0xfe: ['INVALID',     0],
  0xff: ['SELFDESTRUCT', 0],
}

// ─── CBOR Metadata Stripper ───────────────────────────────────────────────────
// Solidity appends CBOR-encoded metadata at the end of bytecode.
// Format (Solidity ≥0.6.0): last 2 bytes = uint16 length of CBOR block
// We strip it before analysis so it doesn't pollute the opcode fingerprint.

export interface CborResult {
  strippedHex: string       // bytecode without metadata suffix
  compilerVersion?: string  // e.g. "0.8.19"
  ipfsHash?: string         // base58-encoded IPFS CID
  swarmHash?: string
  rawCborHex?: string       // the raw CBOR bytes (for storage)
}

function decodeCborMetadata(bytes: Uint8Array): Omit<CborResult, 'strippedHex'> {
  try {
    if (bytes.length < 2) return {}

    // Last 2 bytes = CBOR block length (big-endian)
    const cborLength = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1]

    // Sanity check: CBOR block shouldn't be larger than 100 bytes
    if (cborLength > 100 || cborLength < 2) return {}
    if (cborLength + 2 > bytes.length) return {}

    const cborStart = bytes.length - 2 - cborLength
    const cborBytes = bytes.slice(cborStart, bytes.length - 2)
    const rawCborHex = Buffer.from(cborBytes).toString('hex')

    // Manual CBOR map parsing (avoid external dependency)
    // Solidity CBOR format is a simple map: { "solc": bytes, "ipfs"/"bzzr1": bytes }
    let pos = 0
    const result: Omit<CborResult, 'strippedHex'> = { rawCborHex }

    // First byte should be a CBOR map (0xa0–0xbf)
    if ((cborBytes[pos] & 0xe0) !== 0xa0) return { rawCborHex }
    const mapSize = cborBytes[pos] & 0x1f
    pos++

    for (let i = 0; i < mapSize && pos < cborBytes.length; i++) {
      // Read key (text string)
      if ((cborBytes[pos] & 0xe0) !== 0x60) break
      const keyLen = cborBytes[pos] & 0x1f
      pos++
      const key = new TextDecoder().decode(cborBytes.slice(pos, pos + keyLen))
      pos += keyLen

      // Read value (byte string)
      if ((cborBytes[pos] & 0xe0) !== 0x40) { pos++; continue }
      const valLen = cborBytes[pos] & 0x1f
      pos++
      const val = cborBytes.slice(pos, pos + valLen)
      pos += valLen

      if (key === 'solc' && val.length === 3) {
        // solc version encoded as 3 bytes: major.minor.patch
        result.compilerVersion = `${val[0]}.${val[1]}.${val[2]}`
      } else if (key === 'ipfs' && val.length === 34) {
        // IPFS CIDv0 = 34 bytes (0x1220 + 32-byte hash)
        result.ipfsHash = bufferToBase58(val)
      } else if ((key === 'bzzr0' || key === 'bzzr1') && val.length === 32) {
        result.swarmHash = Buffer.from(val).toString('hex')
      }
    }

    return result
  } catch {
    return {}
  }
}

// Minimal Base58 encoder for IPFS hashes (no external lib needed)
function bufferToBase58(buffer: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits = [0]

  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  let result = ''
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) result += '1'
  for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]]
  return result
}

// ─── Strip CBOR from bytecode ─────────────────────────────────────────────────

export function stripCborMetadata(hexBytecode: string): CborResult {
  // Remove 0x prefix
  const hex = hexBytecode.startsWith('0x') ? hexBytecode.slice(2) : hexBytecode

  // Convert hex → bytes
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  const meta = decodeCborMetadata(bytes)

  // Strip the CBOR block if we found a valid length
  let strippedBytes = bytes
  if (meta.rawCborHex) {
    const cborTotalLen = (meta.rawCborHex.length / 2) + 2 // cbor bytes + 2 length bytes
    strippedBytes = bytes.slice(0, bytes.length - cborTotalLen)
  }

  const strippedHex = '0x' + Array.from(strippedBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return { strippedHex, ...meta }
}

// ─── Core Disassembler ────────────────────────────────────────────────────────

export interface DisassemblyResult {
  // Raw opcode stream
  opcodes: Array<{
    offset: number
    opcode: number
    mnemonic: string
    operand?: string   // hex string of PUSH data
  }>
  // Frequency map: mnemonic → count
  frequencies: Record<string, number>
  // 256-dim normalized vector (index = opcode byte value 0x00–0xFF)
  vector: number[]
  // CBOR metadata
  cbor: CborResult
  // Stats
  totalOpcodes: number
  uniqueOpcodes: number
}

export function disassemble(rawHexBytecode: string): DisassemblyResult {
  // 1. Strip CBOR metadata suffix first
  const cbor = stripCborMetadata(rawHexBytecode)
  const hex = cbor.strippedHex.startsWith('0x')
    ? cbor.strippedHex.slice(2)
    : cbor.strippedHex

  // 2. Convert to byte array
  const bytes: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16))
  }

  // 3. Walk the bytecode
  const opcodes: DisassemblyResult['opcodes'] = []
  const rawFrequencies: number[] = new Array(256).fill(0) // index = opcode byte

  let i = 0
  while (i < bytes.length) {
    const byte = bytes[i]
    const [mnemonic, immBytes] = OPCODES[byte] ?? [`UNKNOWN_0x${byte.toString(16).padStart(2,'0')}`, 0]

    let operand: string | undefined
    if (immBytes > 0) {
      const operandBytes = bytes.slice(i + 1, i + 1 + immBytes)
      operand = operandBytes.map((b) => b.toString(16).padStart(2, '0')).join('')
    }

    opcodes.push({ offset: i, opcode: byte, mnemonic, operand })

    // Count by opcode byte value (not mnemonic) so vector index is stable
    rawFrequencies[byte]++

    i += 1 + immBytes
  }

  // 4. Build frequency map (mnemonic → count) for display
  const frequencies: Record<string, number> = {}
  for (let opByte = 0; opByte < 256; opByte++) {
    if (rawFrequencies[opByte] > 0) {
      const mnemonic = OPCODES[opByte]?.[0] ?? `UNKNOWN_0x${opByte.toString(16).padStart(2,'0')}`
      frequencies[mnemonic] = (frequencies[mnemonic] ?? 0) + rawFrequencies[opByte]
    }
  }

  // 5. Normalize to [0, 1] range for cosine similarity
  //    Divide each frequency by total opcode count
  const totalOpcodes = opcodes.length
  const vector: number[] = rawFrequencies.map((count) =>
    totalOpcodes > 0 ? count / totalOpcodes : 0
  )

  return {
    opcodes,
    frequencies,
    vector,
    cbor,
    totalOpcodes,
    uniqueOpcodes: Object.keys(frequencies).length,
  }
}

// ─── Convenience: just get the vector ─────────────────────────────────────────

export function getBytecodeVector(rawHexBytecode: string): number[] {
  return disassemble(rawHexBytecode).vector
}