// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubSearchResult {
  username: string
  profileUrl: string
  avatarUrl: string
  name?: string
  bio?: string
  publicRepos: number
  followers: number
  repos: FoundRepo[]
  confidence: 'high' | 'medium' | 'low'
  matchReason: string
}

export interface FoundRepo {
  name: string
  fullName: string
  url: string
  description?: string
  stars: number
  language?: string
  createdAt: string
  updatedAt: string
  topics: string[]
}

interface GitHubAPIRepo {
  name: string
  full_name: string
  html_url: string
  description?: string
  stargazers_count: number
  language?: string
  created_at: string
  updated_at: string
  topics?: string[]
  owner: { login: string; avatar_url: string; html_url: string }
}

interface GitHubAPIUser {
  login: string
  html_url: string
  avatar_url: string
  name?: string
  bio?: string
  public_repos: number
  followers: number
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────
// Uses unauthenticated public API: 60 req/hr per IP — sufficient for OSINT tool

const GH_API = 'https://api.github.com'

const GH_HEADERS: Record<string, string> = {
  'Accept': 'application/vnd.github.v3+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN && {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  }),
}

async function ghFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: GH_HEADERS })
    if (res.status === 403) {
      console.warn('GitHub rate limit hit')
      return null
    }
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// ─── Search by Solidity bytecode hash (IPFS CID) ─────────────────────────────
// Developers sometimes push contracts with matching IPFS hashes in their repos

async function searchByIpfsHash(ipfsHash: string): Promise<GitHubAPIRepo[]> {
  const query = encodeURIComponent(`"${ipfsHash}" language:Solidity`)
  const data = await ghFetch<{ items: GitHubAPIRepo[] }>(
    `${GH_API}/search/code?q=${query}&per_page=5`
  )
  return data?.items ?? []
}

// ─── Search by deployer address ───────────────────────────────────────────────
// Devs often hardcode deployer addresses in README or scripts

async function searchByDeployerAddress(address: string): Promise<GitHubAPIRepo[]> {
  const query = encodeURIComponent(`"${address}"`)
  const data = await ghFetch<{ items: GitHubAPIRepo[] }>(
    `${GH_API}/search/code?q=${query}&per_page=5`
  )
  return data?.items ?? []
}

// ─── Search by compiler version + Solidity ───────────────────────────────────
// Narrow search combining compiler version as a stylometric signal

async function searchByCompilerVersion(
  compilerVersion: string,
  deployerAddress?: string
): Promise<GitHubAPIRepo[]> {
  // e.g. "pragma solidity 0.8.19" combined with deployer address
  const base = deployerAddress
    ? `"${deployerAddress}" "pragma solidity"`
    : `"pragma solidity ^${compilerVersion}" language:Solidity`
  const query = encodeURIComponent(base)
  const data = await ghFetch<{ items: GitHubAPIRepo[] }>(
    `${GH_API}/search/code?q=${query}&per_page=5`
  )
  return data?.items ?? []
}

// ─── Fetch full user profile ──────────────────────────────────────────────────

async function fetchUserProfile(username: string): Promise<GitHubAPIUser | null> {
  return ghFetch<GitHubAPIUser>(`${GH_API}/users/${username}`)
}

// ─── Fetch user's Solidity repos ──────────────────────────────────────────────

async function fetchSolidityRepos(username: string): Promise<GitHubAPIRepo[]> {
  const data = await ghFetch<GitHubAPIRepo[]>(
    `${GH_API}/users/${username}/repos?per_page=100&sort=updated`
  )
  if (!data) return []
  return data.filter(
    (r) => r.language === 'Solidity' || r.name.toLowerCase().includes('contract')
  )
}

// ─── Deduplicate repos by owner username ─────────────────────────────────────

function groupReposByOwner(
  repos: GitHubAPIRepo[]
): Map<string, GitHubAPIRepo[]> {
  const map = new Map<string, GitHubAPIRepo[]>()
  for (const repo of repos) {
    const owner = repo.owner.login
    if (!map.has(owner)) map.set(owner, [])
    map.get(owner)!.push(repo)
  }
  return map
}

function mapRepo(r: GitHubAPIRepo): FoundRepo {
  return {
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: r.description ?? undefined,
    stars: r.stargazers_count,
    language: r.language ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    topics: r.topics ?? [],
  }
}

// ─── Main OSINT orchestrator ──────────────────────────────────────────────────

export interface OsintOptions {
  compilerVersion?: string
  ipfsHash?: string
  deployerAddress?: string
}

export async function runOsintEnrichment(
  options: OsintOptions
): Promise<GitHubSearchResult[]> {
  // ─── Client-side Proxy ─────────────────────────────────────────────────────
  // If we're in the browser, call our internal API to keep tokens server-side
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/osint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })
      if (response.ok) return response.json()
      console.warn('OSINT API fallback to unauthenticated client search')
    } catch (err) {
      console.error('OSINT API call failed:', err)
    }
  }

  // ─── Server-side Execution (or client fallback) ────────────────────────────
  const { compilerVersion, ipfsHash, deployerAddress } = options
  const results: GitHubSearchResult[] = []

  // Run all searches in parallel — respect rate limits by capping at 3 concurrent
  const searchPromises: Promise<GitHubAPIRepo[]>[] = []

  if (ipfsHash) {
    searchPromises.push(searchByIpfsHash(ipfsHash))
  }
  if (deployerAddress) {
    searchPromises.push(searchByDeployerAddress(deployerAddress))
  }
  if (compilerVersion && compilerVersion !== 'Unknown') {
    searchPromises.push(searchByCompilerVersion(compilerVersion, deployerAddress))
  }

  if (searchPromises.length === 0) return []

  const searchResults = await Promise.allSettled(searchPromises)
  const allRepos: GitHubAPIRepo[] = []

  for (const result of searchResults) {
    if (result.status === 'fulfilled') {
      allRepos.push(...result.value)
    }
  }

  if (allRepos.length === 0) return []

  // Group by owner and fetch their profiles
  const byOwner = groupReposByOwner(allRepos)
  const ownerEntries = Array.from(byOwner.entries()).slice(0, 5) // max 5 users

  const profilePromises = ownerEntries.map(async ([username, repos]) => {
    const [profile, solidityRepos] = await Promise.all([
      fetchUserProfile(username),
      fetchSolidityRepos(username),
    ])

    if (!profile) return null

    // Determine confidence level
    let confidence: GitHubSearchResult['confidence'] = 'low'
    let matchReason = 'Code pattern found in repository'

    if (ipfsHash && repos.some((r) =>
      allRepos.find((ar) => ar.full_name === r.full_name)
    )) {
      confidence = 'high'
      matchReason = `IPFS hash match: ${ipfsHash.slice(0, 12)}...`
    } else if (deployerAddress) {
      confidence = 'medium'
      matchReason = `Deployer address referenced: ${deployerAddress.slice(0, 10)}...`
    } else if (compilerVersion) {
      confidence = 'low'
      matchReason = `Compiler version match: solc ${compilerVersion}`
    }

    // Merge search-found repos with all their Solidity repos
    const allUserRepos = [
      ...repos,
      ...solidityRepos.filter(
        (r) => !repos.find((existing) => existing.full_name === r.full_name)
      ),
    ].slice(0, 10)

    return {
      username: profile.login,
      profileUrl: profile.html_url,
      avatarUrl: profile.avatar_url,
      name: profile.name ?? undefined,
      bio: profile.bio ?? undefined,
      publicRepos: profile.public_repos,
      followers: profile.followers,
      repos: allUserRepos.map(mapRepo),
      confidence,
      matchReason,
    } satisfies GitHubSearchResult
  })

  const profiles = await Promise.allSettled(profilePromises)

  for (const p of profiles) {
    if (p.status === 'fulfilled' && p.value !== null) {
      results.push(p.value)
    }
  }

  // Sort by confidence: high → medium → low
  const order = { high: 0, medium: 1, low: 2 }
  return results.sort((a, b) => order[a.confidence] - order[b.confidence])
}