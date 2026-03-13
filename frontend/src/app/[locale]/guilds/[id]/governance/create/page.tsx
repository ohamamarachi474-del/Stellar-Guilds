'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, FileText, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { ProposalType } from '@/types/ui'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be less than 5000 characters'),
  type: z.enum(['treasury', 'rule-change', 'membership', 'general']),
  executionData: z.string().optional().refine(
    (data) => {
      if (!data || data.trim() === '') return true
      try {
        JSON.parse(data)
        return true
      } catch {
        return false
      }
    },
    { message: 'Execution data must be valid JSON' }
  )
})

type ProposalFormData = z.infer<typeof proposalSchema>

export default function CreateProposalPage() {
  const params = useParams()
  const router = useRouter()
  const guildId = params.id as string
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      type: 'general',
      executionData: ''
    }
  })

  const watchedData = watch()
  const executionData = watchedData.executionData

  const onSubmit = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setSubmitSuccess(true)

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push(`/guilds/${guildId}/governance`)
    }, 2000)
  }

  const getTypeLabel = (type: ProposalType): string => {
    const labels: Record<ProposalType, string> = {
      treasury: 'Treasury',
      'rule-change': 'Rule Change',
      membership: 'Membership',
      general: 'General'
    }
    return labels[type]
  }

  const formatExecutionPreview = (data: string): string => {
    if (!data || data.trim() === '') return 'No execution data provided'
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return data
    }
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-stellar-navy">
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stellar-white mb-2">Proposal Created!</h2>
              <p className="text-stellar-slate mb-6">
                Your proposal has been submitted successfully. Redirecting to governance dashboard...
              </p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-stellar-navy">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Link href={`/guilds/${guildId}/governance`}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
                Back to Governance
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-stellar-white mt-4">
              Create Proposal
            </h1>
            <p className="text-stellar-slate mt-2">
              Submit a new proposal for guild governance
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card title="Basic Information">
              <div className="space-y-4">
                <Input
                  label="Proposal Title"
                  placeholder="Enter a clear and descriptive title"
                  {...register('title')}
                  error={errors.title?.message}
                  helperText="A good title clearly describes what the proposal aims to achieve"
                />

                <Textarea
                  label="Description"
                  placeholder="Provide detailed information about your proposal..."
                  rows={8}
                  {...register('description')}
                  error={errors.description?.message}
                  helperText="Explain the purpose, rationale, and expected outcomes of this proposal"
                />

                <div>
                  <label className="text-sm font-medium text-stellar-slate mb-2 block">
                    Proposal Type
                  </label>
                  <select
                    {...register('type')}
                    className="flex h-10 w-full rounded-md border border-stellar-slate bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                  >
                    <option value="general">General</option>
                    <option value="treasury">Treasury</option>
                    <option value="rule-change">Rule Change</option>
                    <option value="membership">Membership</option>
                  </select>
                  <p className="text-xs text-stellar-slate mt-1">
                    Selected: {getTypeLabel(watchedData.type || 'general')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Execution Data */}
            <Card title="Execution Data (Optional)">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-stellar-slate">
                    Provide JSON data that will be executed if the proposal passes
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    leftIcon={showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  >
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </div>

                <Textarea
                  placeholder='{"action": "transfer", "amount": 1000, "currency": "XLM"}'
                  rows={6}
                  {...register('executionData')}
                  error={errors.executionData?.message}
                  helperText="Enter valid JSON data. This field is optional."
                />

                {showPreview && executionData && executionData.trim() !== '' && (
                  <div className="p-4 rounded-lg bg-stellar-navy border border-stellar-lightNavy">
                    <p className="text-xs text-stellar-slate mb-2">Execution Preview:</p>
                    <pre className="text-xs text-stellar-slate overflow-x-auto">
                      {formatExecutionPreview(executionData)}
                    </pre>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href={`/guilds/${guildId}/governance`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                isLoading={isSubmitting}
                leftIcon={<FileText size={18} />}
              >
                {isSubmitting ? 'Creating...' : 'Create Proposal'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
