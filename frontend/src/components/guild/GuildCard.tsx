'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

export type GuildTier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface GuildCardProps {
  name: string
  description: string
  tier: GuildTier
  memberCount: number
  logo?: string
  isLoading?: boolean
  onClick?: () => void
}

const tierConfig: Record<GuildTier, { colorClass: string; badgeClass: string }> = {
  bronze: {
    colorClass: 'from-amber-700/20 to-amber-800/5 border-amber-700/30',
    badgeClass: 'bg-amber-700/20 text-amber-400 border-amber-700/30',
  },
  silver: {
    colorClass: 'from-slate-400/20 to-slate-500/5 border-slate-400/30',
    badgeClass: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
  },
  gold: {
    colorClass: 'from-yellow-500/20 to-amber-600/5 border-yellow-500/30',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  platinum: {
    colorClass: 'from-cyan-400/20 to-cyan-600/5 border-cyan-400/30',
    badgeClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
  },
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-700/50 rounded-xl" />
        <div className="flex-1">
          <div className="h-5 bg-slate-700/50 rounded w-2/3 mb-2" />
          <div className="h-4 bg-slate-700/50 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-700/50 rounded w-full" />
        <div className="h-4 bg-slate-700/50 rounded w-3/4" />
      </div>
      <div className="h-4 bg-slate-700/50 rounded w-20" />
    </div>
  )
}

export default function GuildCard({
  name,
  description,
  tier,
  memberCount,
  logo,
  isLoading = false,
  onClick,
}: GuildCardProps) {
  const tierInfo = tierConfig[tier]
  const isClickable = !!onClick

  if (isLoading) {
    return (
      <div className="relative p-5 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <Skeleton />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isClickable ? { y: -4 } : undefined}
      transition={{ duration: 0.3 }}
      className={clsx(
        'relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300',
        `bg-gradient-to-br ${tierInfo.colorClass}`,
        'hover:shadow-lg',
        isClickable && 'cursor-pointer hover:border-slate-600/50'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Header with logo and name */}
      <div className="flex items-start gap-4 mb-4">
        {/* Logo / Avatar */}
        <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-slate-400">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name and tier badge */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate mb-1">
            {name}
          </h3>
          <span
            className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize',
              tierInfo.badgeClass
            )}
          >
            {tier}
          </span>
        </div>

        {/* Arrow indicator */}
        {isClickable && (
          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        {description}
      </p>

      {/* Member count */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Users className="w-4 h-4" />
        <span>{memberCount.toLocaleString()} members</span>
      </div>

      {/* Gradient overlay on hover */}
      {isClickable && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.div>
  )
}