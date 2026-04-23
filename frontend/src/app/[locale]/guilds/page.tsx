"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGuildStore } from "@/store/guildStore";
import { GuildCard } from "@/features/guilds/components/GuildCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GuildsPage() {
  const router = useRouter();
  const { guilds, fetchGuilds } = useGuildStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedTier, setSelectedTier] = useState<string>("");

  useEffect(() => {
    fetchGuilds();
  }, [fetchGuilds]);

  const categories = [
    "Development",
    "DeFi",
    "Education",
    "Gaming",
    "NFT",
    "DAO",
    "Social",
  ];
  const tiers = ["All", "bronze", "silver", "gold", "platinum"];

  const filteredGuilds = guilds.filter((guild) => {
    const matchesSearch =
      guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guild.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategories.size === 0 ||
      (guild.category !== undefined && selectedCategories.has(guild.category));

    const matchesTier =
      !selectedTier || selectedTier === "All" || guild.tier === selectedTier;

    return matchesSearch && matchesCategory && matchesTier;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Discover Guilds
            </h1>
            <p className="text-slate-400 mt-1">
              Find and join communities that match your interests
            </p>
          </div>
          <Link href="/guilds/create">
            <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
              Create Guild
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900/40 rounded-lg shadow-sm border border-slate-800/50 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search guilds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900/40 text-white"
                />
              </div>
            </div>

            {/* Tier Filter */}
            <div className="w-full lg:w-48">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-4 py-2 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900/40 text-white capitalize"
              >
                {tiers.map((tier) => (
                  <option key={tier} value={tier === "All" ? "" : tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/50">
            <span className="text-sm font-medium text-slate-400 mr-2">Categories:</span>
            {categories.map((cat) => {
              const isActive = selectedCategories.has(cat);
              const count = guilds.filter((g) => g.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    const newSet = new Set(selectedCategories);
                    if (newSet.has(cat)) {
                      newSet.delete(cat);
                    } else {
                      newSet.add(cat);
                    }
                    setSelectedCategories(newSet);
                  }}
                  className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50"
                      : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-300"
                  }`}
                >
                  {cat}
                  <span
                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            {selectedCategories.size > 0 && (
              <button
                onClick={() => setSelectedCategories(new Set())}
                className="ml-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors underline"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-400">
            Showing {filteredGuilds.length} of {guilds.length} guilds
          </p>
        </div>

        {/* Guild Grid */}
        {filteredGuilds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuilds.map((guild) => (
              <GuildCard key={guild.id} guild={guild} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No guilds found"
            description="Try adjusting your search or filters, or create a new guild."
            createLabel="Create Guild"
            onCreate={() => router.push("/guilds/create")}
            illustration={<Filter className="h-14 w-14 text-gray-400" />}
            className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          />
        )}
      </div>
    </div>
  );
}
