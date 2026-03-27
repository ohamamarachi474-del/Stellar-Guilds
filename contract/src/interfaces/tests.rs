#[cfg(test)]
mod tests {
    use crate::bounty::types::{Bounty, BountyStatus};
    use crate::dispute::types::{Dispute, DisputeReference, DisputeStatus};
    use crate::governance::types::{ExecutionPayload, Proposal, ProposalStatus, ProposalType};
    use crate::guild::types::{Member, Role};
    use crate::interfaces::{
        bounty, dispute, governance, guild, milestone, payment, reputation, subscription,
        treasury, ContractCallResult,
    };
    use crate::milestone::types::{Milestone, MilestoneStatus};
    use crate::payment::types::DistributionStatus;
    use crate::reputation::types::ReputationProfile;
    use crate::subscription::types::{MembershipTier, Subscription, SubscriptionStatus};
    use crate::treasury::types::{Transaction, TransactionStatus, TransactionType, Treasury};
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{contract, contractimpl, Address, Env, Map, String, Vec};

    #[contract]
    struct InterfaceMockContract;

    #[contractimpl]
    impl InterfaceMockContract {
        pub fn get_member(_env: Env, guild_id: u64, address: Address) -> Member {
            Member {
                address,
                role: Role::Admin,
                joined_at: guild_id,
            }
        }

        pub fn get_all_members(env: Env, guild_id: u64) -> Vec<Member> {
            let member = Self::get_member(env.clone(), guild_id, Address::generate(&env));
            Vec::from_array(&env, [member])
        }

        pub fn is_member(_env: Env, guild_id: u64, _address: Address) -> bool {
            guild_id == 7
        }

        pub fn has_permission(_env: Env, _guild_id: u64, _address: Address, role: Role) -> bool {
            role == Role::Admin
        }

        pub fn get_pool_status(_env: Env, pool_id: u64) -> DistributionStatus {
            if pool_id == 1 {
                DistributionStatus::Pending
            } else {
                DistributionStatus::Executed
            }
        }

        pub fn get_recipient_amount(_env: Env, pool_id: u64, _recipient: Address) -> i128 {
            pool_id as i128 * 10
        }

        pub fn validate_distribution(_env: Env, pool_id: u64) -> bool {
            pool_id == 1
        }

        pub fn get_bounty_data(env: Env, bounty_id: u64) -> Bounty {
            Bounty {
                id: bounty_id,
                guild_id: 7,
                creator: Address::generate(&env),
                title: String::from_str(&env, "Bounty"),
                description: String::from_str(&env, "Bounty desc"),
                reward_amount: 100,
                funded_amount: 100,
                token: Address::generate(&env),
                status: BountyStatus::Funded,
                claimer: None,
                submission_url: None,
                created_at: 1,
                expires_at: 2,
            }
        }

        pub fn get_guild_bounties_list(env: Env, guild_id: u64) -> Vec<Bounty> {
            Vec::from_array(&env, [Self::get_bounty_data(env.clone(), guild_id)])
        }

        pub fn expire_bounty(_env: Env, bounty_id: u64) -> bool {
            bounty_id == 9
        }

        pub fn get_dispute(env: Env, dispute_id: u64) -> Dispute {
            Dispute {
                id: dispute_id,
                reference_id: 1,
                reference_type: DisputeReference::Bounty,
                guild_id: 7,
                plaintiff: Address::generate(&env),
                defendant: Address::generate(&env),
                reason: String::from_str(&env, "reason"),
                status: DisputeStatus::Open,
                created_at: 1,
                voting_deadline: 2,
                evidence_plaintiff: None,
                evidence_defendant: None,
                votes_for_plaintiff: 0,
                votes_for_defendant: 0,
                votes_split: 0,
                vote_count: 0,
                resolved_at: None,
                resolution_executed: false,
            }
        }

        pub fn calculate_dispute_vote_weight(_env: Env, guild_id: u64, _voter: Address) -> u32 {
            guild_id as u32
        }

        pub fn get_proposal(env: Env, proposal_id: u64) -> Proposal {
            Proposal {
                id: proposal_id,
                guild_id: 7,
                proposer: Address::generate(&env),
                proposal_type: ProposalType::GeneralDecision,
                title: String::from_str(&env, "Proposal"),
                description: String::from_str(&env, "desc"),
                voting_start: 1,
                voting_end: 2,
                status: ProposalStatus::Active,
                votes_for: 1,
                votes_against: 0,
                votes_abstain: 0,
                execution_payload: ExecutionPayload::GeneralDecision,
                passed_at: None,
                executed_at: None,
            }
        }

        pub fn get_active_proposals(env: Env, proposal_id: u64) -> Vec<Proposal> {
            Vec::from_array(&env, [Self::get_proposal(env.clone(), proposal_id)])
        }

        pub fn get_milestone(env: Env, milestone_id: u64) -> Milestone {
            Milestone {
                id: milestone_id,
                project_id: 1,
                order: 0,
                title: String::from_str(&env, "Milestone"),
                description: String::from_str(&env, "desc"),
                payment_amount: 55,
                deadline: 100,
                status: MilestoneStatus::Approved,
                proof_url: String::from_str(&env, "proof"),
                created_at: 1,
                submitted_at: None,
                last_updated_at: 1,
                version: 1,
                is_payment_released: false,
            }
        }

        pub fn get_reputation(_env: Env, guild_id: u64, address: Address) -> ReputationProfile {
            ReputationProfile {
                address,
                guild_id,
                total_score: 100,
                decayed_score: 90,
                contributions_count: 2,
                last_activity: 5,
                last_decay_applied: 5,
            }
        }

        pub fn get_reputation_global(_env: Env, _address: Address) -> u64 {
            77
        }

        pub fn get_subscription(env: Env, subscription_id: u64) -> Subscription {
            Subscription {
                id: subscription_id,
                plan_id: 1,
                subscriber: Address::generate(&env),
                status: SubscriptionStatus::Active,
                current_tier: MembershipTier::Standard,
                started_at: 1,
                ends_at: None,
                next_billing_at: 10,
                last_payment_at: None,
                last_payment_amount: None,
                failed_payment_count: 0,
                grace_period_ends_at: None,
                auto_renew: true,
                cancelled_at: None,
                cancellation_reason: None,
            }
        }

        pub fn is_subscription_active(_env: Env, subscription_id: u64) -> bool {
            subscription_id == 1
        }

        pub fn get_treasury(env: Env, treasury_id: u64) -> Treasury {
            Treasury {
                id: treasury_id,
                guild_id: 7,
                owner: Address::generate(&env),
                signers: Vec::new(&env),
                approval_threshold: 2,
                high_value_threshold: 1000,
                balance_xlm: 500,
                token_balances: Map::new(&env),
                total_deposits: 700,
                total_withdrawals: 200,
                paused: false,
            }
        }

        pub fn get_treasury_balance(_env: Env, treasury_id: u64, _token: Option<Address>) -> i128 {
            treasury_id as i128 * 100
        }

        pub fn get_transaction_history(env: Env, treasury_id: u64, _limit: u32) -> Vec<Transaction> {
            Vec::from_array(
                &env,
                [Transaction {
                    id: 1,
                    treasury_id,
                    tx_type: TransactionType::Deposit,
                    amount: 300,
                    token: None,
                    recipient: None,
                    proposer: Address::generate(&env),
                    approvals: Vec::new(&env),
                    status: TransactionStatus::Executed,
                    created_at: 1,
                    expires_at: 2,
                    reason: String::from_str(&env, "seed"),
                }],
            )
        }
    }

    #[test]
    fn test_interface_invoke_success_paths() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InterfaceMockContract);
        let user = Address::generate(&env);

        assert!(matches!(
            guild::invoke(&env, &contract_id, guild::GuildContractCall::GetMember(7, user.clone())),
            Ok(ContractCallResult::Member(_))
        ));
        assert!(matches!(
            guild::invoke(&env, &contract_id, guild::GuildContractCall::GetAllMembers(7)),
            Ok(ContractCallResult::Members(_))
        ));
        assert_eq!(
            guild::invoke(&env, &contract_id, guild::GuildContractCall::IsMember(7, user.clone())),
            Ok(ContractCallResult::Bool(true))
        );
        assert_eq!(
            guild::invoke(
                &env,
                &contract_id,
                guild::GuildContractCall::HasPermission(7, user.clone(), Role::Admin)
            ),
            Ok(ContractCallResult::Bool(true))
        );

        assert!(matches!(
            bounty::invoke(&env, &contract_id, bounty::BountyContractCall::GetBounty(5)),
            Ok(ContractCallResult::Bounty(_))
        ));
        assert!(matches!(
            bounty::invoke(&env, &contract_id, bounty::BountyContractCall::GetGuildBounties(7)),
            Ok(ContractCallResult::Bounties(_))
        ));
        assert_eq!(
            bounty::invoke(&env, &contract_id, bounty::BountyContractCall::ExpireBounty(9)),
            Ok(ContractCallResult::Bool(true))
        );

        assert!(matches!(
            dispute::invoke(&env, &contract_id, dispute::DisputeContractCall::GetDispute(3)),
            Ok(ContractCallResult::Dispute(_))
        ));
        assert_eq!(
            dispute::invoke(
                &env,
                &contract_id,
                dispute::DisputeContractCall::CalculateVoteWeight(7, user.clone())
            ),
            Ok(ContractCallResult::U64(7))
        );

        assert!(matches!(
            governance::invoke(&env, &contract_id, governance::GovernanceContractCall::GetProposal(4)),
            Ok(ContractCallResult::Proposal(_))
        ));
        assert!(matches!(
            governance::invoke(
                &env,
                &contract_id,
                governance::GovernanceContractCall::GetActiveProposals(7)
            ),
            Ok(ContractCallResult::Proposals(_))
        ));

        assert!(matches!(
            milestone::invoke(&env, &contract_id, milestone::MilestoneContractCall::GetMilestone(8)),
            Ok(ContractCallResult::Milestone(_))
        ));

        assert_eq!(
            payment::invoke(&env, &contract_id, payment::PaymentContractCall::GetPoolStatus(1)),
            Ok(ContractCallResult::DistributionStatus(DistributionStatus::Pending))
        );
        assert_eq!(
            payment::invoke(
                &env,
                &contract_id,
                payment::PaymentContractCall::GetRecipientAmount(2, user.clone())
            ),
            Ok(ContractCallResult::I128(20))
        );
        assert_eq!(
            payment::invoke(&env, &contract_id, payment::PaymentContractCall::ValidateDistribution(1)),
            Ok(ContractCallResult::Bool(true))
        );

        assert!(matches!(
            reputation::invoke(
                &env,
                &contract_id,
                reputation::ReputationContractCall::GetReputation(7, user.clone())
            ),
            Ok(ContractCallResult::ReputationProfile(_))
        ));
        assert_eq!(
            reputation::invoke(
                &env,
                &contract_id,
                reputation::ReputationContractCall::GetGlobalReputation(user.clone())
            ),
            Ok(ContractCallResult::U64(77))
        );

        assert!(matches!(
            subscription::invoke(
                &env,
                &contract_id,
                subscription::SubscriptionContractCall::GetSubscription(1)
            ),
            Ok(ContractCallResult::Subscription(_))
        ));
        assert_eq!(
            subscription::invoke(
                &env,
                &contract_id,
                subscription::SubscriptionContractCall::IsSubscriptionActive(1)
            ),
            Ok(ContractCallResult::Bool(true))
        );

        assert!(matches!(
            treasury::invoke(&env, &contract_id, treasury::TreasuryContractCall::GetTreasury(11)),
            Ok(ContractCallResult::Treasury(_))
        ));
        assert_eq!(
            treasury::invoke(
                &env,
                &contract_id,
                treasury::TreasuryContractCall::GetTreasuryBalance(11, None)
            ),
            Ok(ContractCallResult::I128(1100))
        );
        assert!(matches!(
            treasury::invoke(
                &env,
                &contract_id,
                treasury::TreasuryContractCall::GetTransactionHistory(11, 5)
            ),
            Ok(ContractCallResult::Transactions(_))
        ));
    }

    #[test]
    fn test_interface_invoke_failure_paths() {
        let env = Env::default();
        let bad_contract = Address::generate(&env);
        let user = Address::generate(&env);

        assert!(guild::invoke(&env, &bad_contract, guild::GuildContractCall::GetMember(1, user.clone())).is_err());
        assert!(bounty::invoke(&env, &bad_contract, bounty::BountyContractCall::GetBounty(1)).is_err());
        assert!(dispute::invoke(&env, &bad_contract, dispute::DisputeContractCall::GetDispute(1)).is_err());
        assert!(governance::invoke(&env, &bad_contract, governance::GovernanceContractCall::GetProposal(1)).is_err());
        assert!(milestone::invoke(&env, &bad_contract, milestone::MilestoneContractCall::GetMilestone(1)).is_err());
        assert!(payment::invoke(&env, &bad_contract, payment::PaymentContractCall::GetPoolStatus(1)).is_err());
        assert!(reputation::invoke(&env, &bad_contract, reputation::ReputationContractCall::GetGlobalReputation(user.clone())).is_err());
        assert!(subscription::invoke(&env, &bad_contract, subscription::SubscriptionContractCall::GetSubscription(1)).is_err());
        assert!(treasury::invoke(&env, &bad_contract, treasury::TreasuryContractCall::GetTreasury(1)).is_err());
    }
}
