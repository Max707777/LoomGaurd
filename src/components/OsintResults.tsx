'use client'

import { GitHubSearchResult } from '@/lib/osint'
import { cn } from '@/lib/utils'
import { Github, ExternalLink, Star, BookOpen, Users, Shield, AlertTriangle, Info } from 'lucide-react'

type FoundRepo = GitHubSearchResult['repos'][0]

const CONFIDENCE_CONFIG = {
  high: {
    label: 'HIGH CONFIDENCE',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertTriangle,
  },
  medium: {
    label: 'MEDIUM CONFIDENCE',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: Shield,
  },
  low: {
    label: 'LOW CONFIDENCE',
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-700/40',
    icon: Info,
  },
}

function RepoCard({ repo }: { repo: FoundRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 hover:border-zinc-600 transition-colors"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-zinc-500 flex-shrink-0" />
          <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white">
            {repo.name}
          </span>
          {repo.language && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 flex-shrink-0">
              {repo.language}
            </span>
          )}
        </div>
        {repo.description && (
          <p className="mt-0.5 text-[11px] text-zinc-600 truncate">{repo.description}</p>
        )}
        {repo.topics && repo.topics.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {repo.topics.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 text-zinc-600">
        <Star className="h-3 w-3" />
        <span className="text-[11px] tabular-nums">{repo.stars}</span>
      </div>
    </a>
  )
}

function OsintCard({ result }: { result: GitHubSearchResult }) {
  const config = CONFIDENCE_CONFIG[result.confidence]
  const Icon = config.icon

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', config.bg, config.border)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <img
          src={result.avatarUrl}
          alt={result.username}
          className="h-10 w-10 rounded-full border border-zinc-700 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={result.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-semibold text-white hover:text-indigo-300 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              {'@'}{result.username}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
            <span className={cn(
              'text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border',
              config.color, config.bg, config.border
            )}>
              {config.label}
            </span>
          </div>
          {result.name && (
            <p className="text-xs text-zinc-400 mt-0.5">{result.name}</p>
          )}
          {result.bio && (
            <p className="text-xs text-zinc-500 mt-0.5 italic truncate">{result.bio}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {result.publicRepos} repos
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {result.followers} followers
        </span>
      </div>

      {/* Match reason */}
      <div className="rounded-lg px-3 py-2 flex items-start gap-2 bg-zinc-900/60 border border-zinc-800">
        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', config.color)} />
        <p className="text-xs text-zinc-400">{result.matchReason}</p>
      </div>

      {/* Repos */}
      {result.repos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
            Solidity Repositories ({result.repos.length})
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {result.repos.map((repo) => (
              <RepoCard key={repo.fullName} repo={repo} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface OsintResultsProps {
  results: GitHubSearchResult[]
  isLoading?: boolean
}

export default function OsintResults({ results, isLoading }: OsintResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">GitHub OSINT</p>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full skeleton" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-32 rounded skeleton" />
                <div className="h-2.5 w-48 rounded skeleton" />
              </div>
            </div>
            <div className="h-2.5 w-full rounded skeleton" />
            <div className="h-2.5 w-3/4 rounded skeleton" />
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
        <Github className="h-7 w-7 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">No GitHub profiles found</p>
        <p className="text-xs text-zinc-600 mt-1">
          No repositories matched the bytecode metadata signals
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
        GitHub OSINT — {results.length} profile{results.length !== 1 ? 's' : ''} found
      </p>
      {results.map((r) => (
        <OsintCard key={r.username} result={r} />
      ))}
    </div>
  )
}