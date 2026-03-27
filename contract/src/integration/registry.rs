use crate::integration::events as integration_events;
use crate::integration::types::{ContractType, ContractVersion, EventType};
use crate::upgrade::types::Version;
use crate::utils::errors::{format_error, IntegrationErrorCode};
use crate::utils::validation::{is_version_increment, validate_address};
use soroban_sdk::{symbol_short, Address, Env, Map, Symbol, Vec};

const REGISTRY_KEY: Symbol = symbol_short!("i_reg");
const HISTORY_KEY: Symbol = symbol_short!("i_hist");

pub fn initialize(env: &Env) {
    let registry: Map<ContractType, ContractVersion> = Map::new(env);
    let history: Map<ContractType, Vec<ContractVersion>> = Map::new(env);
    env.storage().persistent().set(&REGISTRY_KEY, &registry);
    env.storage().persistent().set(&HISTORY_KEY, &history);
}

pub fn register_contract(
    env: &Env,
    contract_type: ContractType,
    address: Address,
    version: Version,
) -> bool {
    if !validate_address(&address) {
        let _ = format_error(
            env,
            IntegrationErrorCode::InvalidAddress,
            soroban_sdk::String::from_str(env, "contract address failed validation"),
        );
        panic!("contract address failed validation");
    }

    let mut registry = get_registry(env);
    if registry.contains_key(contract_type) {
        let _ = format_error(
            env,
            IntegrationErrorCode::ContractAlreadyRegistered,
            soroban_sdk::String::from_str(env, "contract type already exists in registry"),
        );
        panic!("contract type already exists in registry");
    }

    if has_address_collision(&registry, &address) {
        let _ = format_error(
            env,
            IntegrationErrorCode::ContractAddressCollision,
            soroban_sdk::String::from_str(env, "address already registered for another contract"),
        );
        panic!("address already registered for another contract");
    }

    let record = ContractVersion {
        contract_type,
        version: version.clone(),
        address: address.clone(),
        deployed_at: env.ledger().timestamp(),
    };

    registry.set(contract_type, record.clone());
    env.storage().persistent().set(&REGISTRY_KEY, &registry);
    append_history(env, contract_type, record.clone());

    integration_events::emit_event(
        env,
        EventType::ContractRegistered,
        contract_type,
        soroban_sdk::String::from_str(env, "contract registered"),
        1,
    );

    true
}

pub fn get_contract_address(env: &Env, contract_type: ContractType) -> Address {
    get_registry(env)
        .get(contract_type)
        .unwrap_or_else(|| {
            let _ = format_error(
                env,
                IntegrationErrorCode::ContractNotRegistered,
                soroban_sdk::String::from_str(env, "contract type not found"),
            );
            panic!("contract type not found")
        })
        .address
}

pub fn update_contract(
    env: &Env,
    contract_type: ContractType,
    new_address: Address,
    new_version: Version,
) -> bool {
    if !validate_address(&new_address) {
        let _ = format_error(
            env,
            IntegrationErrorCode::InvalidAddress,
            soroban_sdk::String::from_str(env, "new address failed validation"),
        );
        panic!("new address failed validation");
    }

    let mut registry = get_registry(env);
    let current = registry.get(contract_type).unwrap_or_else(|| {
        let _ = format_error(
            env,
            IntegrationErrorCode::ContractNotRegistered,
            soroban_sdk::String::from_str(env, "cannot update missing contract"),
        );
        panic!("cannot update missing contract")
    });

    if !is_version_increment(&current.version, &new_version) {
        let _ = format_error(
            env,
            IntegrationErrorCode::VersionMustIncrease,
            soroban_sdk::String::from_str(env, "new version must be greater than current"),
        );
        panic!("new version must be greater than current");
    }

    if has_address_collision_except(&registry, contract_type, &new_address) {
        let _ = format_error(
            env,
            IntegrationErrorCode::ContractAddressCollision,
            soroban_sdk::String::from_str(env, "address already registered for another contract"),
        );
        panic!("address already registered for another contract");
    }

    let updated = ContractVersion {
        contract_type,
        version: new_version.clone(),
        address: new_address,
        deployed_at: env.ledger().timestamp(),
    };

    registry.set(contract_type, updated.clone());
    env.storage().persistent().set(&REGISTRY_KEY, &registry);
    append_history(env, contract_type, updated.clone());

    integration_events::emit_event(
        env,
        EventType::ContractUpdated,
        contract_type,
        soroban_sdk::String::from_str(env, "contract updated"),
        1,
    );

    true
}

pub fn get_all_contracts(env: &Env) -> Vec<ContractVersion> {
    let registry = get_registry(env);
    let mut contracts = Vec::new(env);

    for (_, contract) in registry.iter() {
        contracts.push_back(contract);
    }

    contracts
}

pub fn get_contract(env: &Env, contract_type: ContractType) -> Option<ContractVersion> {
    get_registry(env).get(contract_type)
}

pub fn find_contract_type_by_address(env: &Env, address: &Address) -> Option<ContractType> {
    let registry = get_registry(env);
    for (contract_type, contract) in registry.iter() {
        if contract.address == *address {
            return Some(contract_type);
        }
    }
    None
}

fn get_registry(env: &Env) -> Map<ContractType, ContractVersion> {
    env.storage()
        .persistent()
        .get(&REGISTRY_KEY)
        .unwrap_or_else(|| Map::new(env))
}

fn get_history(env: &Env) -> Map<ContractType, Vec<ContractVersion>> {
    env.storage()
        .persistent()
        .get(&HISTORY_KEY)
        .unwrap_or_else(|| Map::new(env))
}

fn append_history(env: &Env, contract_type: ContractType, record: ContractVersion) {
    let mut history = get_history(env);
    let mut entries = history.get(contract_type).unwrap_or_else(|| Vec::new(env));
    entries.push_back(record);
    history.set(contract_type, entries);
    env.storage().persistent().set(&HISTORY_KEY, &history);
}

fn has_address_collision(registry: &Map<ContractType, ContractVersion>, address: &Address) -> bool {
    for (_, contract) in registry.iter() {
        if contract.address == *address {
            return true;
        }
    }
    false
}

fn has_address_collision_except(
    registry: &Map<ContractType, ContractVersion>,
    current_type: ContractType,
    address: &Address,
) -> bool {
    for (contract_type, contract) in registry.iter() {
        if contract_type != current_type && contract.address == *address {
            return true;
        }
    }
    false
}
