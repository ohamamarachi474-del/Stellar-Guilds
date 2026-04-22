"use client";

import React from "react";
import { UserProfile } from "../types";
import { Trophy, Star, Shield, Gem } from "lucide-react";
import { ExperienceProgressBar } from "./ExperienceProgressBar";

import { twMerge } from "tailwind-merge";

interface ReputationCardProps {
  user: UserProfile;
}

const tierStyles = {
  Bronze: "border-stone-700 bg-slate-900/50 shadow-sm",
  Silver: "border-slate-600 bg-slate-800/50 shadow-sm",
  Gold: "border-yellow-500/50 bg-gradient-to-br from-slate-900 via-yellow-900/20 to-slate-900 shadow-lg shadow-yellow-500/10",
  Platinum: "border-cyan-500/50 bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 shadow-lg shadow-cyan-500/10",
  Diamond: "border-fuchsia-500/50 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 shadow-lg shadow-purple-500/20 diamond-glow",
};

const tierIcons = {
  Bronze: Shield,
  Silver: Shield,
  Gold: Star,
  Platinum: Trophy,
  Diamond: Gem,
};

export const ReputationCard: React.FC<ReputationCardProps> = ({ user }) => {
  const TierIcon = tierIcons[user.tier] || Shield;

  return (
    <div
      className={twMerge(
        "relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1",
        tierStyles[user.tier]
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Current Tier
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <TierIcon className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold text-white">
              {user.tier}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">
            {user.reputationScore}
          </p>
          <p className="text-xs text-slate-500">Reputation Score</p>
        </div>
      </div>

      <ExperienceProgressBar
        currentXP={user.reputationScore}
        nextLevelXP={user.nextTierScore}
      />
    </div>
  );
};
