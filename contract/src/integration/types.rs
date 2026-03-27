use crate::upgrade::types::Version;
use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ContractType {
    Guild = 0,
    Bounty = 1,
    Payment = 2,
    Milestone = 3,
    Dispute = 4,
    Reputation = 5,
    Treasury = 6,
    Subscription = 7,
    Governance = 8,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractVersion {
    pub contract_type: ContractType,
    pub version: Version,
    pub address: Address,
    pub deployed_at: u64,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EventType {
    GuildCreated = 0,
    GuildMemberAdded = 1,
    GuildMemberRemoved = 2,
    GuildRoleUpdated = 3,
    BountyCreated = 4,
    BountyFunded = 5,
    BountyClaimed = 6,
    BountyCompleted = 7,
    BountyCancelled = 8,
    PaymentDistributed = 9,
    PaymentPoolCreated = 10,
    PaymentRecipientAdded = 11,
    MilestoneCreated = 12,
    MilestoneStarted = 13,
    MilestoneSubmitted = 14,
    MilestoneApproved = 15,
    MilestonePaymentReleased = 16,
    DisputeCreated = 17,
    DisputeVoteCast = 18,
    DisputeResolved = 19,
    ReputationUpdated = 20,
    ReputationAchievementAwarded = 21,
    ReputationTierChanged = 22,
    TreasuryDeposited = 23,
    TreasuryWithdrawalProposed = 24,
    TreasuryTransactionExecuted = 25,
    SubscriptionCreated = 26,
    SubscriptionPaymentExecuted = 27,
    SubscriptionCancelled = 28,
    GovernanceProposalCreated = 29,
    GovernanceVoted = 30,
    GovernanceProposalExecuted = 31,
    ContractRegistered = 32,
    ContractUpdated = 33,
    AuthorizationVerified = 34,
    TreasuryInitialized = 35,
    SubscriptionPlanCreated = 36,
    GovernanceFinalized = 37,
    DisputeEvidenceSubmitted = 38,
    AllowanceGranted = 39,
    AllowanceRevoked = 40,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlatformEvent {
    pub id: u128,
    pub event_type: EventType,
    pub contract_source: ContractType,
    pub contract_address: Address,
    pub timestamp: u64,
    pub schema_version: u32,
    pub data: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventFilter {
    pub has_contract_source: bool,
    pub contract_source: ContractType,
    pub has_event_type: bool,
    pub event_type: EventType,
    pub subscriber: Option<Address>,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CrossContractPermission {
    Read = 0,
    Execute = 1,
    EmitEvents = 2,
    RegistryWrite = 3,
    Admin = 4,
}
