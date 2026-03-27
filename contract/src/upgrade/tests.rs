#![cfg(test)]

use super::{logic, storage};
use super::types::*;
use crate::StellarGuildsContract;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

fn create_test_version(major: u32, minor: u32, patch: u32) -> Version {
    Version::new(major, minor, patch)
}

fn setup_upgrade_storage() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.budget().reset_unlimited();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, StellarGuildsContract);
    let governance = Address::generate(&env);
    let proposer = Address::generate(&env);
    env.as_contract(&contract_id, || {
        storage::initialize(&env, create_test_version(1, 0, 0), governance.clone());
    });

    (env, contract_id, governance, proposer)
}

#[test]
fn test_version_compatibility() {
    let _env = Env::default();

    let v1_0_0 = create_test_version(1, 0, 0);
    let v1_1_0 = create_test_version(1, 1, 0);
    let v2_0_0 = create_test_version(2, 0, 0);

    // Same version should be compatible
    assert!(v1_0_0.is_compatible_with(&v1_0_0));

    // Later minor version should be compatible
    assert!(v1_1_0.is_compatible_with(&v1_0_0));

    // Earlier minor version should not be compatible with later
    assert!(!v1_0_0.is_compatible_with(&v1_1_0));

    // Different major versions should not be compatible
    assert!(!v2_0_0.is_compatible_with(&v1_0_0));
    assert!(!v1_0_0.is_compatible_with(&v2_0_0));
}

#[test]
fn test_version_struct() {
    let version = create_test_version(1, 2, 3);
    assert_eq!(version.major, 1);
    assert_eq!(version.minor, 2);
    assert_eq!(version.patch, 3);
}

#[test]
fn test_upgrade_status_enum() {
    let pending = UpgradeStatus::Pending;
    let approved = UpgradeStatus::Approved;
    let executed = UpgradeStatus::Executed;
    let rejected = UpgradeStatus::Rejected;
    let cancelled = UpgradeStatus::Cancelled;

    assert_eq!(pending as u32, 0);
    assert_eq!(approved as u32, 1);
    assert_eq!(executed as u32, 2);
    assert_eq!(rejected as u32, 3);
    assert_eq!(cancelled as u32, 4);
}

#[test]
fn test_migration_plan() {
    let env = Env::default();
    let from_version = create_test_version(1, 0, 0);
    let to_version = create_test_version(1, 1, 0);
    let selector = soroban_sdk::symbol_short!("migrate");

    let migration_plan = MigrationPlan {
        from_version,
        to_version,
        migration_function_selector: selector,
        estimated_gas: 100000,
    };

    assert_eq!(migration_plan.from_version.major, 1);
    assert_eq!(migration_plan.to_version.minor, 1);
    assert_eq!(migration_plan.estimated_gas, 100000);
}

#[test]
fn test_storage_round_trip_and_flags() {
    let (env, contract_id, governance, proposer) = setup_upgrade_storage();
    let proposal = UpgradeProposal {
        id: 7,
        proposer: proposer.clone(),
        new_contract_address: Address::generate(&env),
        version: create_test_version(1, 2, 0),
        description: String::from_str(&env, "storage"),
        timestamp: 11,
        status: UpgradeStatus::Pending,
        votes_for: 0,
        votes_against: 0,
        total_voters: 2,
    };

    env.as_contract(&contract_id, || {
        assert_eq!(storage::get_current_version(&env), create_test_version(1, 0, 0));
        assert_eq!(storage::get_governance_address(&env), governance);
        assert!(!storage::is_emergency_upgrade_enabled(&env));

        storage::set_voting_power(&env, &proposer, 3);
        assert_eq!(storage::get_voting_power(&env, &proposer), 3);

        storage::store_upgrade_proposal(&env, &proposal);
        assert_eq!(storage::get_upgrade_proposal(&env, 7).unwrap().version.minor, 2);

        storage::update_proposal_status(&env, 7, UpgradeStatus::Approved);
        assert_eq!(
            storage::get_upgrade_proposal(&env, 7).unwrap().status,
            UpgradeStatus::Approved
        );

        let migration = MigrationPlan {
            from_version: create_test_version(1, 0, 0),
            to_version: create_test_version(1, 2, 0),
            migration_function_selector: soroban_sdk::symbol_short!("migr"),
            estimated_gas: 42,
        };
        storage::store_migration_plan(&env, 7, &migration);
        assert_eq!(storage::get_migration_plan(&env, 7).unwrap().estimated_gas, 42);

        storage::set_emergency_upgrade_enabled(&env, true);
        assert!(storage::is_emergency_upgrade_enabled(&env));
        assert!(storage::get_pending_proposals(&env).is_empty());
    });
}

#[test]
fn test_propose_vote_approve_and_execute_upgrade() {
    let (env, contract_id, governance, proposer) = setup_upgrade_storage();
    let target_contract = Address::generate(&env);

    env.as_contract(&contract_id, || {
        storage::set_voting_power(&env, &proposer, 1);
    });

    let proposal_id = env.as_contract(&contract_id, || {
        let proposal_id = logic::propose_upgrade(
            &env,
            &proposer,
            &target_contract,
            &create_test_version(1, 1, 0),
            String::from_str(&env, "upgrade"),
        );
        proposal_id
    });

    env.as_contract(&contract_id, || {
        let mut proposal = storage::get_upgrade_proposal(&env, proposal_id).unwrap();
        proposal.total_voters = 1;
        storage::store_upgrade_proposal(&env, &proposal);
    });

    let migration = MigrationPlan {
        from_version: create_test_version(1, 0, 0),
        to_version: create_test_version(1, 1, 0),
        migration_function_selector: soroban_sdk::symbol_short!("migr"),
        estimated_gas: 500,
    };

    env.as_contract(&contract_id, || {
        assert!(logic::register_migration_plan(&env, &governance, proposal_id, &migration).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert!(logic::vote_on_proposal(&env, &proposer, proposal_id, true).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert_eq!(
            storage::get_upgrade_proposal(&env, proposal_id).unwrap().status,
            UpgradeStatus::Approved
        );
    });

    env.as_contract(&contract_id, || {
        assert!(logic::execute_upgrade(&env, &governance, proposal_id).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert_eq!(storage::get_current_version(&env), create_test_version(1, 1, 0));
        assert_eq!(
            storage::get_upgrade_proposal(&env, proposal_id).unwrap().status,
            UpgradeStatus::Executed
        );
    });
}

#[test]
fn test_vote_can_reject_and_execute_requires_approval() {
    let (env, contract_id, governance, proposer) = setup_upgrade_storage();
    let target_contract = Address::generate(&env);
    let voter = Address::generate(&env);

    env.as_contract(&contract_id, || {
        storage::set_voting_power(&env, &voter, 1);
    });
    let proposal_id = env.as_contract(&contract_id, || {
        let proposal_id = logic::propose_upgrade(
            &env,
            &proposer,
            &target_contract,
            &create_test_version(1, 0, 1),
            String::from_str(&env, "reject me"),
        );
        proposal_id
    });
    env.as_contract(&contract_id, || {
        let mut proposal = storage::get_upgrade_proposal(&env, proposal_id).unwrap();
        proposal.total_voters = 1;
        storage::store_upgrade_proposal(&env, &proposal);
    });

    env.as_contract(&contract_id, || {
        assert!(logic::vote_on_proposal(&env, &voter, proposal_id, false).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert_eq!(
            storage::get_upgrade_proposal(&env, proposal_id).unwrap().status,
            UpgradeStatus::Rejected
        );
    });
    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::execute_upgrade(&env, &governance, proposal_id),
            Err("Proposal is not approved for execution")
        );
    });
}

#[test]
fn test_upgrade_authorization_and_emergency_paths() {
    let (env, contract_id, governance, proposer) = setup_upgrade_storage();
    let outsider = Address::generate(&env);
    let target_contract = Address::generate(&env);
    let v110 = create_test_version(1, 1, 0);

    let migration = MigrationPlan {
        from_version: create_test_version(1, 0, 0),
        to_version: v110.clone(),
        migration_function_selector: soroban_sdk::symbol_short!("migr"),
        estimated_gas: 7,
    };

    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::register_migration_plan(&env, &outsider, 1, &migration),
            Err("Only governance address can register migration plans")
        );
    });

    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::toggle_emergency_upgrades(&env, &outsider, true),
            Err("Only governance address can toggle emergency upgrades")
        );
    });
    env.as_contract(&contract_id, || {
        assert!(logic::toggle_emergency_upgrades(&env, &governance, true).is_ok());
    });

    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::emergency_upgrade(&env, &outsider, &target_contract, &v110),
            Err("Only governance address can perform emergency upgrades")
        );
    });
    env.as_contract(&contract_id, || {
        assert!(logic::emergency_upgrade(&env, &governance, &target_contract, &v110).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert_eq!(storage::get_current_version(&env), v110);
    });

    let proposal_id = env.as_contract(&contract_id, || {
        logic::propose_upgrade(
            &env,
            &proposer,
            &target_contract,
            &create_test_version(1, 2, 0),
            String::from_str(&env, "auth"),
        )
    });
    env.as_contract(&contract_id, || {
        let mut proposal = storage::get_upgrade_proposal(&env, proposal_id).unwrap();
        proposal.status = UpgradeStatus::Approved;
        storage::store_upgrade_proposal(&env, &proposal);
    });

    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::execute_upgrade(&env, &outsider, proposal_id),
            Err("Only governance address can execute upgrades")
        );
    });
}

#[test]
fn test_version_compatibility_and_rollback() {
    let (env, contract_id, governance, _) = setup_upgrade_storage();
    let outsider = Address::generate(&env);

    let current = create_test_version(1, 2, 0);
    let earlier = create_test_version(1, 1, 0);
    let later = create_test_version(1, 3, 0);
    let major_bump = create_test_version(2, 0, 0);
    env.as_contract(&contract_id, || {
        storage::set_current_version(&env, &current);
    });

    env.as_contract(&contract_id, || {
        assert!(logic::check_version_compatibility(&current, &later));
        assert!(!logic::check_version_compatibility(&current, &earlier));
        assert!(!logic::check_version_compatibility(&current, &major_bump));
    });

    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::rollback_to_version(&env, &outsider, &earlier),
            Err("Only governance address can perform rollbacks")
        );
    });
    env.as_contract(&contract_id, || {
        assert_eq!(
            logic::rollback_to_version(&env, &governance, &major_bump),
            Err("Can only rollback to earlier versions in the same major series")
        );
    });
    env.as_contract(&contract_id, || {
        assert!(logic::rollback_to_version(&env, &governance, &earlier).is_ok());
        assert_eq!(storage::get_current_version(&env), earlier);
    });
}
