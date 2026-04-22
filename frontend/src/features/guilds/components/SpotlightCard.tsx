'use client'

import Image from 'next/image'
import { Star, Award } from 'lucide-react'
import type { GuildMember } from '../types'

interface SpotlightCardProps {
  member: GuildMember & {
    bio?: string
    techTags?: string[]
    monthlyReputation?: number
  }
}

export function SpotlightCard({ member }: SpotlightCardProps) {
  const { username, avatar, bio, techTags = [], monthlyReputation = 0 } = member

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-gradient-to-r from-yellow-500/50 via-amber-500/50 to-yellow-500/50 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 p-6 shadow-lg">
      {/* Spotlight glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 opacity-50" />
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-tr from-yellow-400/20 to-amber-500/20 blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h3 className="text-lg font-bold text-white">Monthly Spotlight</h3>
          </div>
          <Award className="w-6 h-6 text-amber-400" />
        </div>

        {/* Member Info */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-1 shadow-lg shadow-yellow-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={username}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-3xl font-bold text-yellow-400">
                    {username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-2xl font-bold text-white mb-2">
              {username}
            </h4>
            
            {bio && (
              <p className="text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                {bio}
              </p>
            )}

            {/* Tech Tags */}
            {techTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {techTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reputation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-500/20">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">
                  {monthlyReputation} REP
                </span>
                <span className="text-xs text-yellow-400/70">this month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
