"use client";

import React from "react";
import { motion } from "framer-motion";

interface ExperienceProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
}

export const ExperienceProgressBar: React.FC<ExperienceProgressBarProps> = ({
  currentXP,
  nextLevelXP,
}) => {
  const percentage =
    nextLevelXP > 0 ? Math.min((currentXP / nextLevelXP) * 100, 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        <span>Experience Progress</span>
        <span className="rounded-full border border-cyan-400/20 bg-slate-900/80 px-3 py-1 text-[11px] tracking-[0.18em] text-cyan-200">
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>

      <div className="relative h-4 overflow-hidden rounded-full border border-white/10 bg-slate-950/80 shadow-inner shadow-cyan-950/40">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9),rgba(15,23,42,0.95))]" />
        <motion.div
          className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.08)_35%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0.08)_65%,transparent_100%)]"
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 2.8, ease: "linear", repeat: Infinity }}
          />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center px-3 text-[11px] font-semibold text-slate-100">
          <span className="drop-shadow-[0_1px_2px_rgba(2,6,23,0.9)]">
            {currentXP} / {nextLevelXP} XP
          </span>
        </div>
      </div>
    </div>
  );
};
