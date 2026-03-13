'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, User, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { ProposalStatus } from '@/types/ui'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { VotingPanel } from '@/features/governance/components/VotingPanel'
import { ResultsChart } from '@/features/governance/components/ResultsChart'
import { QuorumTracker } from '@/features/governance/components/QuorumTracker'
import { VoteDelegation } from '@/features/governance/components/VoteDelegation'
import { getProposalById, mockUserVotingPower } from '@/lib/mocks/governance'
import { cn } from '@/lib/utils'

export default function ProposalDetailPage() {
  const params = useParams()
  const guildId = params.id as string
  const proposalId = params.proposalId as string

  const proposal = getProposalById(proposalId)

  if (!proposal) {
    return (
      <div className="flex flex-col min-h-screen bg-stellar-navy p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold text-stellar-white mb-4">Proposal Not Found</h2>
            <p className="text-stellar-slate mb-6">The proposal you&apos;re looking for doesn&apos;t exist.</p>
            <Link href={`/guilds/${guildId}/governance`}>
              <Button>Back to Governance</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusConfig = (status: ProposalStatus) => {
    const configs: Record<ProposalStatus, { label: string; color: string; icon: React.ReactNode }> = {
      draft: { label: 'Draft', color: 'bg-stellar-slate text-stellar-white', icon: <Loader2 size={16} /> },
      active: { label: 'Active', color: 'bg-gold-500 text-stellar-navy', icon: <Clock size={16} /> },
      passed: { label: 'Passed', color: 'bg-green-500 text-white', icon: <CheckCircle2 size={16} /> },
      rejected: { label: 'Rejected', color: 'bg-red-500 text-white', icon: <XCircle size={16} /> },
      executed: { label: 'Executed', color: 'bg-green-600 text-white', icon: <CheckCircle2 size={16} /> }
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(proposal.status)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      treasury: 'Treasury',
      'rule-change': 'Rule Change',
      membership: 'Membership',
      general: 'General'
    }
    return labels[type] || type
  }

  const timelineEvents = [
    { label: 'Created', date: proposal.createdAt, status: 'completed' },
    { label: 'Voting Started', date: proposal.startDate, status: 'completed' },
    {
      label: proposal.status === 'passed' ? 'Passed' : proposal.status === 'rejected' ? 'Rejected' : 'Voting Ends',
      date: proposal.endDate,
      status: proposal.status === 'active' ? 'pending' : 'completed'
    }
  ]

  const handleVote = (choice: string) => {
    // In a real app, this would trigger an API call
    // For now, we'll just refresh the page data (simulated)
    console.log('Vote cast:', choice)
  }

  return (
    <div className="flex flex-col min-h-screen bg-stellar-navy">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link href={`/guilds/${guildId}/governance`}>
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
                  Back to Governance
                </Button>
              </Link>
              <div className="flex items-center gap-3 mt-4">
                <span className={cn(
                  "text-sm px-3 py-1 rounded-md flex items-center gap-2",
                  statusConfig.color
                )}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
                <span className="text-sm px-3 py-1 rounded-md bg-stellar-lightNavy text-stellar-slate">
                  {getTypeLabel(proposal.type)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-stellar-white mt-4">
                {proposal.title}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Proposal Info */}
              <Card>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-stellar-slate">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>Proposed by <span className="text-stellar-white font-medium">{proposal.proposerName}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>Created {formatDate(proposal.createdAt)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stellar-lightNavy">
                    <h3 className="text-lg font-semibold text-stellar-white mb-3">Description</h3>
                    <p className="text-stellar-slate leading-relaxed whitespace-pre-wrap">
                      {proposal.description}
                    </p>
                  </div>

                  {proposal.executionData && (
                    <div className="pt-4 border-t border-stellar-lightNavy">
                      <h3 className="text-lg font-semibold text-stellar-white mb-3">Execution Data</h3>
                      <pre className="p-4 rounded-lg bg-stellar-navy border border-stellar-lightNavy text-xs text-stellar-slate overflow-x-auto">
                        {proposal.executionData}
                      </pre>
                    </div>
                  )}
                </div>
              </Card>

              {/* Timeline */}
              <Card title="Proposal Timeline">
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        event.status === 'completed'
                          ? "bg-green-500 text-white"
                          : "bg-stellar-slate text-stellar-white"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 pb-4 border-b border-stellar-lightNavy last:border-0">
                        <p className="text-stellar-white font-medium">{event.label}</p>
                        <p className="text-sm text-stellar-slate">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <VotingPanel proposal={proposal} onVote={handleVote} />
              <VoteDelegation
                proposalId={proposal.id}
                userVotingPower={mockUserVotingPower}
              />
              <ResultsChart stats={proposal.votingStats} showPower={true} />
              <QuorumTracker proposal={proposal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
