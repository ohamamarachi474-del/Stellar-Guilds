#![cfg(test)]

use crate::proxy::{implementation, storage, types::ProxyConfig};
use crate::StellarGuildsContract;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env};

fn setup_proxy() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.budget().reset_unlimited();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, StellarGuildsContract);
    let implementation = Address::generate(&env);
    let admin = Address::generate(&env);
    let outsider = Address::generate(&env);
    env.as_contract(&contract_id, || {
        storage::initialize(&env, implementation.clone(), admin.clone());
    });

    (env, contract_id, implementation, admin, outsider)
}

#[test]
fn test_proxy_storage_and_getters() {
    let (env, contract_id, implementation, admin, _) = setup_proxy();

    env.as_contract(&contract_id, || {
        let config = storage::get_proxy_config(&env);
        assert_eq!(config.implementation, implementation);
        assert_eq!(config.admin, admin);
        assert_eq!(config.version, 1);
        assert_eq!(storage::get_implementation(&env), implementation);
        assert_eq!(storage::get_admin(&env), admin);
        assert!(storage::is_admin(&env, &admin));
        assert!(storage::is_current_implementation(&env, &implementation));
    });
}

#[test]
fn test_proxy_upgrade_records_transaction_and_bumps_version() {
    let (env, contract_id, implementation, admin, _) = setup_proxy();
    let new_implementation = Address::generate(&env);

    env.as_contract(&contract_id, || {
        assert!(implementation::upgrade(&env, &admin, &new_implementation).is_ok());
    });

    env.as_contract(&contract_id, || {
        let config: ProxyConfig = implementation::get_proxy_info(&env);
        assert_eq!(config.implementation, new_implementation);
        assert_eq!(config.version, 2);
        assert_ne!(config.implementation, implementation);

        let tx = storage::get_upgrade_transaction(&env, 1).unwrap();
        assert_eq!(tx.id, 1);
        assert_eq!(tx.new_implementation, new_implementation);
        assert_eq!(tx.initiator, admin);
        assert!(tx.success);
    });
}

#[test]
fn test_proxy_admin_rotation_and_guards() {
    let (env, contract_id, _, admin, outsider) = setup_proxy();
    let new_admin = Address::generate(&env);
    let next_impl = Address::generate(&env);

    env.as_contract(&contract_id, || {
        assert_eq!(
            implementation::upgrade(&env, &outsider, &next_impl),
            Err("Only admin can perform upgrades")
        );
    });
    env.as_contract(&contract_id, || {
        assert_eq!(
            implementation::transfer_admin(&env, &outsider, &new_admin),
            Err("Only admin can transfer admin rights")
        );
    });

    env.as_contract(&contract_id, || {
        assert!(implementation::transfer_admin(&env, &admin, &new_admin).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert_eq!(storage::get_admin(&env), new_admin);
        assert!(!storage::is_admin(&env, &admin));
    });
    env.as_contract(&contract_id, || {
        assert!(implementation::accept_admin(&env, &new_admin).is_ok());
    });
}

#[test]
fn test_proxy_pause_resume_and_paused_query() {
    let (env, contract_id, _, admin, outsider) = setup_proxy();

    env.as_contract(&contract_id, || {
        assert_eq!(
            implementation::emergency_stop(&env, &outsider),
            Err("Only admin can trigger emergency stop")
        );
    });
    env.as_contract(&contract_id, || {
        assert_eq!(
            implementation::resume(&env, &outsider),
            Err("Only admin can resume")
        );
    });

    env.as_contract(&contract_id, || {
        assert!(implementation::emergency_stop(&env, &admin).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert!(implementation::resume(&env, &admin).is_ok());
    });
    env.as_contract(&contract_id, || {
        assert!(!implementation::is_paused(&env));
    });
}
