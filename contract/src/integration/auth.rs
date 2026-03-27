use crate::integration::registry;
use crate::integration::types::{ContractType, CrossContractPermission};
use crate::utils::errors::{format_error, IntegrationErrorCode};
use crate::DataKey;
use soroban_sdk::{Address, Env};

pub fn require_admin(env: &Env, caller: &Address) {
    caller.require_auth();

    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("contract admin not initialized");

    if admin != *caller {
        let _ = format_error(
            env,
            IntegrationErrorCode::Unauthorized,
            soroban_sdk::String::from_str(env, "only admin can manage integration layer"),
        );
        panic!("only admin can manage integration layer");
    }
}

pub fn verify_cross_contract_auth(
    env: &Env,
    caller: Address,
    target_contract: ContractType,
    required_permission: CrossContractPermission,
) -> bool {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("contract admin not initialized");

    if caller == admin {
        return true;
    }

    let Some(caller_type) = registry::find_contract_type_by_address(env, &caller) else {
        return false;
    };

    if registry::get_contract(env, target_contract).is_none() {
        return false;
    }

    match required_permission {
        CrossContractPermission::Read => can_read(caller_type, target_contract),
        CrossContractPermission::Execute => can_execute(caller_type, target_contract),
        CrossContractPermission::EmitEvents => caller_type == target_contract,
        CrossContractPermission::RegistryWrite => caller_type == ContractType::Governance,
        CrossContractPermission::Admin => caller_type == ContractType::Governance,
    }
}

fn can_read(caller: ContractType, target: ContractType) -> bool {
    if caller == target {
        return true;
    }

    matches!(
        (caller, target),
        (ContractType::Guild, ContractType::Bounty)
            | (ContractType::Guild, ContractType::Payment)
            | (ContractType::Guild, ContractType::Milestone)
            | (ContractType::Guild, ContractType::Reputation)
            | (ContractType::Guild, ContractType::Governance)
            | (ContractType::Bounty, ContractType::Guild)
            | (ContractType::Bounty, ContractType::Milestone)
            | (ContractType::Bounty, ContractType::Payment)
            | (ContractType::Bounty, ContractType::Treasury)
            | (ContractType::Bounty, ContractType::Dispute)
            | (ContractType::Payment, ContractType::Guild)
            | (ContractType::Payment, ContractType::Bounty)
            | (ContractType::Payment, ContractType::Milestone)
            | (ContractType::Payment, ContractType::Treasury)
            | (ContractType::Milestone, ContractType::Guild)
            | (ContractType::Milestone, ContractType::Bounty)
            | (ContractType::Milestone, ContractType::Payment)
            | (ContractType::Dispute, ContractType::Guild)
            | (ContractType::Dispute, ContractType::Bounty)
            | (ContractType::Dispute, ContractType::Milestone)
            | (ContractType::Treasury, _)
            | (ContractType::Governance, _)
            | (ContractType::Reputation, ContractType::Guild)
            | (ContractType::Subscription, ContractType::Guild)
    )
}

fn can_execute(caller: ContractType, target: ContractType) -> bool {
    if caller == target {
        return true;
    }

    matches!(
        (caller, target),
        (ContractType::Guild, ContractType::Bounty)
            | (ContractType::Guild, ContractType::Governance)
            | (ContractType::Guild, ContractType::Subscription)
            | (ContractType::Bounty, ContractType::Payment)
            | (ContractType::Bounty, ContractType::Milestone)
            | (ContractType::Bounty, ContractType::Dispute)
            | (ContractType::Milestone, ContractType::Payment)
            | (ContractType::Treasury, ContractType::Payment)
            | (ContractType::Governance, ContractType::Treasury)
    )
}
