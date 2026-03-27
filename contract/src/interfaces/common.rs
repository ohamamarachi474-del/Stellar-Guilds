use crate::bounty::types::Bounty;
use crate::dispute::types::Dispute;
use crate::governance::types::Proposal;
use crate::guild::types::Member;
use crate::milestone::types::Milestone;
use crate::payment::types::DistributionStatus;
use crate::reputation::types::ReputationProfile;
use crate::subscription::types::Subscription;
use crate::treasury::types::{Transaction, Treasury};
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ContractCallResult {
    Bool(bool),
    U64(u64),
    I128(i128),
    Address(Address),
    Member(Member),
    Members(Vec<Member>),
    Bounty(Bounty),
    Bounties(Vec<Bounty>),
    Dispute(Dispute),
    Milestone(Milestone),
    Proposal(Proposal),
    Proposals(Vec<Proposal>),
    ReputationProfile(ReputationProfile),
    Subscription(Subscription),
    DistributionStatus(DistributionStatus),
    Transactions(Vec<Transaction>),
    Treasury(Treasury),
    Message(String),
}

pub type ContractCallResponse = Result<ContractCallResult, IntegrationErrorCode>;
