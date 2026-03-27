use crate::events::{
    emit_event as publish_event,
    topics::{
        ACT_APPROVED, ACT_BADGE_EARNED, ACT_CANCELLED, ACT_CLAIMED, ACT_COMPLETED, ACT_CREATED,
        ACT_DISTRIBUTED, ACT_EMITTED, ACT_EVIDENCE, ACT_EXECUTED, ACT_FINALIZED, ACT_FUNDED,
        ACT_GRANTED, ACT_MEMBER_ADDED, ACT_MEMBER_REMOVED, ACT_PAYMENT_FAILED,
        ACT_PAYMENT_PROCESSED, ACT_PLAN_CREATED, ACT_PROPOSED, ACT_RECIPIENT_ADDED, ACT_RELEASED,
        ACT_RESOLVED, ACT_REVOKED, ACT_ROLE_UPDATED, ACT_STARTED, ACT_SUBMITTED, ACT_TIER_CHANGED,
        ACT_UPDATED, ACT_VOTED, ACT_VOTE_CAST, MOD_ALLOWANCE, MOD_BOUNTY, MOD_DISPUTE,
        MOD_GOVERNANCE, MOD_GUILD, MOD_INTEGRATION, MOD_MILESTONE, MOD_PAYMENT, MOD_REPUTATION,
        MOD_SUBSCRIPTION, MOD_TREASURY,
    },
};
use crate::integration::registry;
use crate::integration::types::{ContractType, EventFilter, EventType, PlatformEvent};
use crate::utils::errors::{format_error, IntegrationErrorCode};
use soroban_sdk::{symbol_short, Address, Env, Map, Symbol, Vec};

const EVENT_LOG_KEY: Symbol = symbol_short!("i_evt");
const SUBSCRIPTIONS_KEY: Symbol = symbol_short!("i_sub");
const EVENT_COUNTER_KEY: Symbol = symbol_short!("i_cnt");

pub fn initialize(env: &Env) {
    let events: Vec<PlatformEvent> = Vec::new(env);
    let subscriptions: Map<Address, Vec<EventType>> = Map::new(env);

    env.storage().persistent().set(&EVENT_LOG_KEY, &events);
    env.storage()
        .persistent()
        .set(&SUBSCRIPTIONS_KEY, &subscriptions);
    env.storage().persistent().set(&EVENT_COUNTER_KEY, &0u64);
}

pub fn emit_event(
    env: &Env,
    event_type: EventType,
    source_contract: ContractType,
    data: soroban_sdk::String,
    schema_version: u32,
) -> bool {
    if data.len() > 1024 {
        let _ = format_error(
            env,
            IntegrationErrorCode::EventDataTooLarge,
            soroban_sdk::String::from_str(env, "event payload must be at most 1024 bytes"),
        );
        panic!("event payload must be at most 1024 bytes");
    }

    let contract_address = registry::get_contract_address(env, source_contract);
    let event = PlatformEvent {
        id: create_event_id(env),
        event_type,
        contract_source: source_contract,
        contract_address,
        timestamp: env.ledger().timestamp(),
        schema_version,
        data,
    };

    let mut events = get_events_log(env);
    events.push_back(event.clone());
    env.storage().persistent().set(&EVENT_LOG_KEY, &events);

    publish_event(env, MOD_INTEGRATION, ACT_EMITTED, event);
    true
}

pub fn record_standardized_event(env: &Env, module: &str, action: &str) {
    if module == MOD_INTEGRATION && action == ACT_EMITTED {
        return;
    }

    let Some(contract_source) = map_contract_source(module) else {
        return;
    };
    let Some(event_type) = map_event_type(module, action) else {
        return;
    };

    if registry::get_contract(env, contract_source).is_none() {
        return;
    }

    let event = PlatformEvent {
        id: create_event_id(env),
        event_type,
        contract_source,
        contract_address: registry::get_contract_address(env, contract_source),
        timestamp: env.ledger().timestamp(),
        schema_version: 1,
        data: soroban_sdk::String::from_str(env, action),
    };

    let mut events = get_events_log(env);
    events.push_back(event);
    env.storage().persistent().set(&EVENT_LOG_KEY, &events);
}

pub fn get_events(
    env: &Env,
    filters: EventFilter,
    from_timestamp: u64,
    limit: u32,
) -> Vec<PlatformEvent> {
    if limit == 0 {
        let _ = format_error(
            env,
            IntegrationErrorCode::InvalidLimit,
            soroban_sdk::String::from_str(env, "limit must be greater than zero"),
        );
        panic!("limit must be greater than zero");
    }

    let events = get_events_log(env);
    let mut filtered = Vec::new(env);

    if filters.subscriber.is_some() && !filters.has_event_type {
        let _ = format_error(
            env,
            IntegrationErrorCode::InvalidEventFilter,
            soroban_sdk::String::from_str(env, "subscriber filters require a concrete event type"),
        );
        panic!("subscriber filters require a concrete event type");
    }

    for event in events.iter() {
        if event.timestamp < from_timestamp {
            continue;
        }

        if filters.has_contract_source && event.contract_source != filters.contract_source {
            continue;
        }

        if filters.has_event_type && event.event_type != filters.event_type {
            continue;
        }

        if let Some(subscriber) = filters.subscriber.clone() {
            if !subscriber_accepts_event(env, &subscriber, event.event_type) {
                continue;
            }
        }

        filtered.push_back(event);
        if filtered.len() >= limit {
            break;
        }
    }

    filtered
}

pub fn subscribe_to_events(env: &Env, subscriber: Address, event_types: Vec<EventType>) -> bool {
    let mut subscriptions = get_subscriptions(env);
    subscriptions.set(subscriber, event_types);
    env.storage()
        .persistent()
        .set(&SUBSCRIPTIONS_KEY, &subscriptions);
    true
}

pub fn create_event_id(env: &Env) -> u128 {
    let next_counter = env
        .storage()
        .persistent()
        .get::<_, u64>(&EVENT_COUNTER_KEY)
        .unwrap_or(0)
        + 1;

    env.storage()
        .persistent()
        .set(&EVENT_COUNTER_KEY, &next_counter);
    ((env.ledger().timestamp() as u128) << 64) | next_counter as u128
}

fn get_events_log(env: &Env) -> Vec<PlatformEvent> {
    env.storage()
        .persistent()
        .get(&EVENT_LOG_KEY)
        .unwrap_or_else(|| Vec::new(env))
}

fn get_subscriptions(env: &Env) -> Map<Address, Vec<EventType>> {
    env.storage()
        .persistent()
        .get(&SUBSCRIPTIONS_KEY)
        .unwrap_or_else(|| Map::new(env))
}

fn subscriber_accepts_event(env: &Env, subscriber: &Address, event_type: EventType) -> bool {
    let subscriptions = get_subscriptions(env);
    let Some(event_types) = subscriptions.get(subscriber.clone()) else {
        return false;
    };

    for subscribed in event_types.iter() {
        if subscribed == event_type {
            return true;
        }
    }

    false
}

fn map_contract_source(module: &str) -> Option<ContractType> {
    match module {
        MOD_GUILD => Some(ContractType::Guild),
        MOD_BOUNTY => Some(ContractType::Bounty),
        MOD_PAYMENT => Some(ContractType::Payment),
        MOD_MILESTONE => Some(ContractType::Milestone),
        MOD_DISPUTE => Some(ContractType::Dispute),
        MOD_REPUTATION => Some(ContractType::Reputation),
        MOD_TREASURY => Some(ContractType::Treasury),
        MOD_SUBSCRIPTION => Some(ContractType::Subscription),
        MOD_GOVERNANCE => Some(ContractType::Governance),
        _ => None,
    }
}

fn map_event_type(module: &str, action: &str) -> Option<EventType> {
    match (module, action) {
        (MOD_GUILD, ACT_CREATED) => Some(EventType::GuildCreated),
        (MOD_GUILD, ACT_MEMBER_ADDED) => Some(EventType::GuildMemberAdded),
        (MOD_GUILD, ACT_MEMBER_REMOVED) => Some(EventType::GuildMemberRemoved),
        (MOD_GUILD, ACT_ROLE_UPDATED) => Some(EventType::GuildRoleUpdated),
        (MOD_BOUNTY, ACT_CREATED) => Some(EventType::BountyCreated),
        (MOD_BOUNTY, ACT_FUNDED) => Some(EventType::BountyFunded),
        (MOD_BOUNTY, ACT_CLAIMED) => Some(EventType::BountyClaimed),
        (MOD_BOUNTY, ACT_COMPLETED) => Some(EventType::BountyCompleted),
        (MOD_BOUNTY, ACT_CANCELLED) => Some(EventType::BountyCancelled),
        (MOD_PAYMENT, ACT_DISTRIBUTED) => Some(EventType::PaymentDistributed),
        (MOD_PAYMENT, ACT_CREATED) => Some(EventType::PaymentPoolCreated),
        (MOD_PAYMENT, ACT_RECIPIENT_ADDED) => Some(EventType::PaymentRecipientAdded),
        (MOD_MILESTONE, ACT_CREATED) => Some(EventType::MilestoneCreated),
        (MOD_MILESTONE, ACT_STARTED) => Some(EventType::MilestoneStarted),
        (MOD_MILESTONE, ACT_SUBMITTED) => Some(EventType::MilestoneSubmitted),
        (MOD_MILESTONE, ACT_APPROVED) => Some(EventType::MilestoneApproved),
        (MOD_MILESTONE, ACT_RELEASED) => Some(EventType::MilestonePaymentReleased),
        (MOD_DISPUTE, ACT_CREATED) => Some(EventType::DisputeCreated),
        (MOD_DISPUTE, ACT_EVIDENCE) => Some(EventType::DisputeEvidenceSubmitted),
        (MOD_DISPUTE, ACT_VOTE_CAST) => Some(EventType::DisputeVoteCast),
        (MOD_DISPUTE, ACT_RESOLVED) => Some(EventType::DisputeResolved),
        (MOD_REPUTATION, ACT_UPDATED) => Some(EventType::ReputationUpdated),
        (MOD_REPUTATION, ACT_BADGE_EARNED) => Some(EventType::ReputationAchievementAwarded),
        (MOD_REPUTATION, ACT_TIER_CHANGED) => Some(EventType::ReputationTierChanged),
        (MOD_TREASURY, ACT_CREATED) => Some(EventType::TreasuryInitialized),
        (MOD_TREASURY, ACT_FUNDED) => Some(EventType::TreasuryDeposited),
        (MOD_TREASURY, ACT_PROPOSED) => Some(EventType::TreasuryWithdrawalProposed),
        (MOD_TREASURY, ACT_EXECUTED) => Some(EventType::TreasuryTransactionExecuted),
        (MOD_SUBSCRIPTION, ACT_CREATED) => Some(EventType::SubscriptionCreated),
        (MOD_SUBSCRIPTION, ACT_PLAN_CREATED) => Some(EventType::SubscriptionPlanCreated),
        (MOD_SUBSCRIPTION, ACT_PAYMENT_PROCESSED) | (MOD_SUBSCRIPTION, ACT_PAYMENT_FAILED) => {
            Some(EventType::SubscriptionPaymentExecuted)
        }
        (MOD_SUBSCRIPTION, ACT_CANCELLED) => Some(EventType::SubscriptionCancelled),
        (MOD_GOVERNANCE, ACT_CREATED) | (MOD_GOVERNANCE, ACT_PROPOSED) => {
            Some(EventType::GovernanceProposalCreated)
        }
        (MOD_GOVERNANCE, ACT_VOTED) => Some(EventType::GovernanceVoted),
        (MOD_GOVERNANCE, ACT_EXECUTED) => Some(EventType::GovernanceProposalExecuted),
        (MOD_GOVERNANCE, ACT_FINALIZED) => Some(EventType::GovernanceFinalized),
        (MOD_ALLOWANCE, ACT_GRANTED) => Some(EventType::AllowanceGranted),
        (MOD_ALLOWANCE, ACT_REVOKED) => Some(EventType::AllowanceRevoked),
        _ => None,
    }
}
