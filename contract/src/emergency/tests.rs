#![cfg(test)]

use crate::emergency::{actions, storage, types::EmergencyStatus};
use crate::multisig::storage as multisig_storage;
use crate::multisig::types::{MultiSigOperation, OperationStatus, OperationType};
use crate::StellarGuildsContract;
use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{Address, Env, String, Vec};

fn set_timestamp(env: &Env, timestamp: u64) {
    env.ledger().set(LedgerInfo {
        timestamp,
        protocol_version: 20,
        sequence_number: 1,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 100,
        min_persistent_entry_ttl: 100,
        max_entry_ttl: 1_000_000,
    });
}

fn store_emergency_op(env: &Env, id: u64, proposer: &Address, status: OperationStatus, op_type: OperationType) {
    let op = MultiSigOperation {
        id,
        account_id: 1,
        op_type,
        description: String::from_str(env, "emergency"),
        proposer: proposer.clone(),
        signatures: Vec::new(env),
        nonce: 0,
        created_at: env.ledger().timestamp(),
        expires_at: env.ledger().timestamp() + 100,
        status,
    };
    multisig_storage::store_operation(env, id, &op);
}

fn setup_emergency() -> (Env, Address, Address) {
    let env = Env::default();
    env.budget().reset_unlimited();
    let contract_id = env.register_contract(None, StellarGuildsContract);
    let proposer = Address::generate(&env);
    (env, contract_id, proposer)
}

#[test]
fn test_pause_resume_and_log_flow() {
    let (env, contract_id, proposer) = setup_emergency();
    set_timestamp(&env, 100);
    env.as_contract(&contract_id, || {
        store_emergency_op(&env, 1, &proposer, OperationStatus::Executed, OperationType::EmergencyAction);

        let default_cfg = storage::get_emergency_config(&env);
        assert_eq!(default_cfg.status, EmergencyStatus::Inactive);
        assert!(!storage::is_paused(&env));

        assert!(actions::pause_contract(
            &env,
            1,
            7 * 24 * 60 * 60,
            String::from_str(&env, "maintenance"),
            String::from_str(&env, "ops@guild.test"),
        ));

        let paused_cfg = storage::get_emergency_config(&env);
        assert_eq!(paused_cfg.status, EmergencyStatus::Active);
        assert_eq!(paused_cfg.paused_by, Some(proposer.clone()));
        assert_eq!(paused_cfg.paused_at, 100);
        assert!(storage::is_paused(&env));
        assert!(env
            .storage()
            .persistent()
            .has(&storage::DataKey::EmergencyLog(1)));

        assert!(actions::resume_contract(&env, 1, String::from_str(&env, "done")));
        let resumed_cfg = storage::get_emergency_config(&env);
        assert_eq!(resumed_cfg.status, EmergencyStatus::Inactive);
        assert_eq!(resumed_cfg.expires_at, 0);
        assert!(env
            .storage()
            .persistent()
            .has(&storage::DataKey::EmergencyLog(2)));
    });
}

#[test]
fn test_is_paused_auto_expires() {
    let (env, contract_id, proposer) = setup_emergency();
    set_timestamp(&env, 10);
    env.as_contract(&contract_id, || {
        store_emergency_op(&env, 1, &proposer, OperationStatus::Executed, OperationType::EmergencyAction);

        assert!(actions::pause_contract(
            &env,
            1,
            7 * 24 * 60 * 60,
            String::from_str(&env, "maintenance"),
            String::from_str(&env, "ops@guild.test"),
        ));
    });

    set_timestamp(&env, 10 + (7 * 24 * 60 * 60) + 1);
    env.as_contract(&contract_id, || {
        assert!(!storage::is_paused(&env));
        assert_eq!(storage::get_emergency_config(&env).status, EmergencyStatus::Inactive);
    });
}

#[test]
#[should_panic(expected = "Multisig operation not executed")]
fn test_pause_requires_executed_multisig_op() {
    let (env, contract_id, proposer) = setup_emergency();
    env.as_contract(&contract_id, || {
        store_emergency_op(&env, 1, &proposer, OperationStatus::Pending, OperationType::EmergencyAction);

        actions::pause_contract(
            &env,
            1,
            7 * 24 * 60 * 60,
            String::from_str(&env, "maintenance"),
            String::from_str(&env, "ops@guild.test"),
        );
    });
}

#[test]
#[should_panic(expected = "Invalid operation type")]
fn test_resume_requires_emergency_action_type() {
    let (env, contract_id, proposer) = setup_emergency();
    env.as_contract(&contract_id, || {
        store_emergency_op(
            &env,
            1,
            &proposer,
            OperationStatus::Executed,
            OperationType::GovernanceUpdate,
        );

        actions::resume_contract(&env, 1, String::from_str(&env, "resume"));
    });
}

#[test]
#[should_panic(expected = "Duration must be between 7 and 30 days")]
fn test_pause_enforces_duration_bounds() {
    let (env, contract_id, proposer) = setup_emergency();
    env.as_contract(&contract_id, || {
        store_emergency_op(&env, 1, &proposer, OperationStatus::Executed, OperationType::EmergencyAction);

        actions::pause_contract(
            &env,
            1,
            60,
            String::from_str(&env, "maintenance"),
            String::from_str(&env, "ops@guild.test"),
        );
    });
}
