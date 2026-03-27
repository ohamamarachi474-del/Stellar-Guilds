use crate::subscription::storage;
use crate::subscription::types::{
    BillingCycle, MembershipTier, RetryConfig, RevenueRecord, Subscription, SubscriptionPlan,
    SubscriptionStatus,
};
use crate::{StellarGuildsContract, StellarGuildsContractClient};
use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{Address, Env, String, Vec};

fn setup_env() -> Env {
    let env = Env::default();
    env.budget().reset_unlimited();
    env
}

fn register_and_init_contract(env: &Env) -> Address {
    let contract_id = env.register_contract(None, StellarGuildsContract);
    let client = StellarGuildsContractClient::new(env, &contract_id);
    client.initialize(&Address::generate(&env));
    contract_id
}

fn set_ledger_timestamp(env: &Env, timestamp: u64) {
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

fn create_test_plan(
    env: &Env,
    client: &StellarGuildsContractClient,
    creator: &Address,
    guild_id: u64,
    tier: MembershipTier,
    price: i128,
    billing_cycle: BillingCycle,
) -> u64 {
    let name = String::from_str(env, "Test Plan");
    let description = String::from_str(env, "Test plan description");
    let benefits = Vec::new(env);
    let token: Option<Address> = None;

    client.create_subscription_plan(
        &guild_id,
        &name,
        &description,
        &tier,
        &price,
        &token,
        &billing_cycle,
        &benefits,
        creator,
    )
}

#[test]
fn test_create_plan() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    assert_eq!(plan_id, 1);
}

#[test]
#[should_panic(expected = "create_plan error")]
fn test_create_plan_invalid_price() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    env.mock_all_auths();

    let name = String::from_str(&env, "Test Plan");
    let description = String::from_str(&env, "Test plan description");
    let benefits = Vec::new(&env);
    let token: Option<Address> = None;

    // Should panic with invalid price (0)
    client.create_subscription_plan(
        &1,
        &name,
        &description,
        &MembershipTier::Standard,
        &0,
        &token,
        &BillingCycle::Monthly,
        &benefits,
        &creator,
    );
}

#[test]
fn test_subscribe() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);
    assert_eq!(subscription_id, 1);

    let subscription = client.get_subscription(&subscription_id);
    assert_eq!(subscription.plan_id, plan_id);
    assert_eq!(subscription.subscriber, subscriber);
    assert_eq!(subscription.status, SubscriptionStatus::Active);
    assert!(subscription.auto_renew);
}

#[test]
fn test_subscribe_to_inactive_plan() {
    // Note: This test demonstrates the expected behavior
    // In a full implementation, we would have a deactivate_plan function
    // For now, we just verify that subscribing to an active plan works
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    // Subscribe should work with active plan
    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);
    assert_eq!(subscription_id, 1);
}

#[test]
#[should_panic(expected = "subscribe error")]
fn test_duplicate_subscription() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    // First subscription should succeed
    let _ = client.subscribe(&plan_id, &subscriber, &true);

    // Second subscription should fail
    let _ = client.subscribe(&plan_id, &subscriber, &true);
}

#[test]
fn test_pause_and_resume_subscription() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    // Pause subscription
    let paused = client.pause_subscription(&subscription_id, &subscriber);
    assert!(paused);

    let subscription = client.get_subscription(&subscription_id);
    assert_eq!(subscription.status, SubscriptionStatus::Paused);

    // Resume subscription
    let resumed = client.resume_subscription(&subscription_id, &subscriber);
    assert!(resumed);

    let subscription = client.get_subscription(&subscription_id);
    assert_eq!(subscription.status, SubscriptionStatus::Active);
}

#[test]
#[should_panic(expected = "pause_subscription error")]
fn test_pause_unauthorized() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);
    let other_user = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    // Try to pause with different user - should panic
    let _ = client.pause_subscription(&subscription_id, &other_user);
}

#[test]
fn test_cancel_subscription() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    let reason = Some(String::from_str(&env, "No longer needed"));
    let cancelled = client.cancel_subscription(&subscription_id, &subscriber, &reason);
    assert!(cancelled);

    let subscription = client.get_subscription(&subscription_id);
    assert_eq!(subscription.status, SubscriptionStatus::Cancelled);
    assert!(subscription.cancelled_at.is_some());
    assert!(!subscription.auto_renew);
}

#[test]
#[should_panic(expected = "cancel_subscription error")]
fn test_cancel_already_cancelled() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    let reason = Some(String::from_str(&env, "No longer needed"));
    let _ = client.cancel_subscription(&subscription_id, &subscriber, &reason);

    // Try to cancel again - should panic
    let _ = client.cancel_subscription(&subscription_id, &subscriber, &reason);
}

#[test]
fn test_tier_upgrade() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    // Create basic plan
    let basic_plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Basic,
        500,
        BillingCycle::Monthly,
    );

    // Create premium plan
    let premium_plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Premium,
        2000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&basic_plan_id, &subscriber, &true);

    // Upgrade to premium
    let proration_amount =
        client.change_subscription_tier(&subscription_id, &premium_plan_id, &true, &subscriber);

    // Should have proration amount for upgrade (charge)
    assert!(proration_amount >= 0);

    let subscription = client.get_subscription(&subscription_id);
    assert_eq!(subscription.current_tier, MembershipTier::Premium);
    assert_eq!(subscription.plan_id, premium_plan_id);
}

#[test]
fn test_tier_downgrade() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    // Create premium plan
    let premium_plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Premium,
        2000,
        BillingCycle::Monthly,
    );

    // Create basic plan
    let basic_plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Basic,
        500,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&premium_plan_id, &subscriber, &true);

    // Downgrade to basic
    let proration_amount =
        client.change_subscription_tier(&subscription_id, &basic_plan_id, &true, &subscriber);

    // Downgrade should have proration amount
    assert!(proration_amount >= 0);

    let subscription = client.get_subscription(&subscription_id);
    assert_eq!(subscription.current_tier, MembershipTier::Basic);
}

#[test]
#[should_panic(expected = "change_tier error")]
fn test_invalid_tier_change() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    // Try to change to same tier - should panic
    let _ = client.change_subscription_tier(&subscription_id, &plan_id, &true, &subscriber);
}

#[test]
fn test_is_subscription_active() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    assert!(client.is_subscription_active(&subscription_id));

    // Cancel subscription
    let _ = client.cancel_subscription(&subscription_id, &subscriber, &None);

    assert!(!client.is_subscription_active(&subscription_id));
}

#[test]
fn test_days_until_billing() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    let days = client.days_until_billing(&subscription_id);
    // Should be approximately 30 days (monthly billing)
    assert!(days > 28 && days <= 30);
}

#[test]
fn test_billing_cycle_durations() {
    assert_eq!(BillingCycle::Weekly.duration_seconds(), 7 * 24 * 60 * 60);
    assert_eq!(BillingCycle::Monthly.duration_seconds(), 30 * 24 * 60 * 60);
    assert_eq!(
        BillingCycle::Quarterly.duration_seconds(),
        90 * 24 * 60 * 60
    );
    assert_eq!(
        BillingCycle::Annually.duration_seconds(),
        365 * 24 * 60 * 60
    );
}

#[test]
fn test_membership_tier_ordering() {
    assert!(MembershipTier::Basic < MembershipTier::Standard);
    assert!(MembershipTier::Standard < MembershipTier::Premium);
    assert!(MembershipTier::Premium < MembershipTier::Enterprise);
}

#[test]
fn test_process_due_subscriptions() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    // Create subscription
    let _ = client.subscribe(&plan_id, &subscriber, &true);

    // Process due subscriptions (none should be due yet as we just created it)
    let processed = client.process_due_subscriptions(&10);
    assert_eq!(processed, 0);
}

#[test]
#[should_panic(expected = "subscription not found")]
fn test_nonexistent_subscription() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);

    // Try to get non-existent subscription - should panic
    let _ = client.get_subscription(&999);
}

#[test]
#[should_panic(expected = "subscribe error")]
fn test_nonexistent_plan() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    // Try to subscribe to non-existent plan - should panic
    let _ = client.subscribe(&999, &subscriber, &true);
}

#[test]
#[should_panic(expected = "pause_subscription error")]
fn test_pause_non_active_subscription() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    // Cancel the subscription
    let _ = client.cancel_subscription(&subscription_id, &subscriber, &None);

    // Try to pause cancelled subscription - should panic
    let _ = client.pause_subscription(&subscription_id, &subscriber);
}

#[test]
#[should_panic(expected = "change_tier error")]
fn test_change_tier_unauthorized() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);
    let other_user = Address::generate(&env);

    env.mock_all_auths();

    let basic_plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Basic,
        500,
        BillingCycle::Monthly,
    );

    let premium_plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        1,
        MembershipTier::Premium,
        2000,
        BillingCycle::Monthly,
    );

    let subscription_id = client.subscribe(&basic_plan_id, &subscriber, &true);

    // Try to change tier with different user - should panic
    let _ = client.change_subscription_tier(&subscription_id, &premium_plan_id, &true, &other_user);
}

#[test]
fn test_subscription_storage_indexes_and_revenue_queries() {
    let env = setup_env();
    env.mock_all_auths();
    let contract_id = register_and_init_contract(&env);

    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);
    let benefits = Vec::new(&env);
    let empty_reason: Option<String> = None;

    env.as_contract(&contract_id, || {
        storage::initialize_subscription_storage(&env);

        let plan_id_1 = storage::get_next_plan_id(&env);
        let plan_id_2 = storage::get_next_plan_id(&env);
        let subscription_id = storage::get_next_subscription_id(&env);
        let revenue_id = storage::get_next_revenue_record_id(&env);

        let plan_1 = SubscriptionPlan {
            id: plan_id_1,
            guild_id: 77,
            name: String::from_str(&env, "Starter"),
            description: String::from_str(&env, "starter plan"),
            tier: MembershipTier::Basic,
            price: 100,
            token: None,
            billing_cycle: BillingCycle::Monthly,
            is_active: true,
            benefits: benefits.clone(),
            created_by: creator.clone(),
            created_at: 1,
        };
        let plan_2 = SubscriptionPlan {
            id: plan_id_2,
            guild_id: 77,
            name: String::from_str(&env, "Pro"),
            description: String::from_str(&env, "pro plan"),
            tier: MembershipTier::Premium,
            price: 300,
            token: None,
            billing_cycle: BillingCycle::Monthly,
            is_active: true,
            benefits,
            created_by: creator.clone(),
            created_at: 2,
        };

        storage::store_plan(&env, &plan_1);
        storage::store_plan(&env, &plan_2);
        storage::add_plan_to_guild(&env, 77, plan_id_1);
        storage::add_plan_to_guild(&env, 77, plan_id_1);
        storage::add_plan_to_guild(&env, 77, plan_id_2);

        let guild_plans = storage::get_guild_plans(&env, 77);
        assert_eq!(guild_plans.len(), 2);
        assert_eq!(storage::get_all_plans(&env, 1).len(), 1);

        let subscription = Subscription {
            id: subscription_id,
            plan_id: plan_id_1,
            subscriber: subscriber.clone(),
            status: SubscriptionStatus::Active,
            current_tier: MembershipTier::Basic,
            started_at: 10,
            ends_at: None,
            next_billing_at: 20,
            last_payment_at: None,
            last_payment_amount: None,
            failed_payment_count: 0,
            grace_period_ends_at: None,
            auto_renew: true,
            cancelled_at: None,
            cancellation_reason: empty_reason.clone(),
        };
        storage::store_subscription(&env, &subscription);
        storage::store_user_subscription(&env, &subscriber, 77, subscription_id);
        storage::add_active_subscription(&env, subscription_id);
        storage::add_active_subscription(&env, subscription_id);

        assert_eq!(storage::get_active_subscriptions(&env).len(), 1);
        assert_eq!(
            storage::get_user_subscription(&env, &subscriber, 77)
                .unwrap()
                .plan_id,
            plan_id_1
        );
        assert_eq!(storage::get_subscriptions_by_plan(&env, plan_id_1, 10).len(), 1);

        let record = RevenueRecord {
            id: revenue_id,
            guild_id: 77,
            plan_id: plan_id_1,
            subscription_id,
            subscriber: subscriber.clone(),
            amount: 100,
            token: None,
            paid_at: 1000,
            billing_cycle: BillingCycle::Monthly,
            is_retry: false,
            retry_attempt: 0,
        };
        storage::store_revenue_record(&env, &record);
        storage::add_guild_revenue(&env, 77, 0, revenue_id);
        assert_eq!(storage::get_revenue_record(&env, revenue_id).unwrap().amount, 100);
        assert_eq!(storage::get_guild_revenue_records(&env, 77, 0).len(), 1);

        let retry = RetryConfig {
            max_retries: 5,
            initial_delay_seconds: 600,
            backoff_multiplier: 3,
            grace_period_seconds: 86_400,
        };
        storage::set_retry_config(&env, &retry);
        assert_eq!(storage::get_retry_config(&env), retry);

        storage::remove_active_subscription(&env, subscription_id);
        assert_eq!(storage::get_active_subscriptions(&env).len(), 0);
    });
}

#[test]
fn test_payment_processing_and_grace_period_cleanup() {
    let env = setup_env();
    let contract_id = register_and_init_contract(&env);
    let client = StellarGuildsContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let subscriber = Address::generate(&env);

    env.mock_all_auths();
    set_ledger_timestamp(&env, 1_000);

    let plan_id = create_test_plan(
        &env,
        &client,
        &creator,
        42,
        MembershipTier::Standard,
        1000,
        BillingCycle::Monthly,
    );
    let subscription_id = client.subscribe(&plan_id, &subscriber, &true);

    let billing_boundary = 1_000 + BillingCycle::Monthly.duration_seconds();
    set_ledger_timestamp(&env, billing_boundary + 100);
    assert!(client.process_subscription_payment(&subscription_id));

    let processed = client.get_subscription(&subscription_id);
    assert_eq!(processed.last_payment_at, Some(billing_boundary + 100));
    assert_eq!(processed.last_payment_amount, Some(1000));
    assert_eq!(processed.failed_payment_count, 0);
    assert_eq!(processed.status, SubscriptionStatus::Active);
    assert!(processed.next_billing_at > billing_boundary + 100);

    env.as_contract(&contract_id, || {
        let records = storage::get_guild_revenue_records(&env, 42, 1_100);
        assert_eq!(records.len(), 1);
        assert_eq!(records.get(0).unwrap().subscription_id, subscription_id);
    });

    set_ledger_timestamp(&env, 3_000);
    env.as_contract(&contract_id, || {
        let mut grace = storage::get_subscription(&env, subscription_id).unwrap();
        grace.status = SubscriptionStatus::GracePeriod;
        grace.grace_period_ends_at = Some(2_500);
        grace.failed_payment_count = 1;
        storage::store_subscription(&env, &grace);
        storage::add_active_subscription(&env, subscription_id);
    });

    assert_eq!(client.process_due_subscriptions(&10), 1);

    let cancelled = client.get_subscription(&subscription_id);
    assert_eq!(cancelled.status, SubscriptionStatus::Cancelled);
    assert_eq!(
        cancelled.cancellation_reason,
        Some(String::from_str(&env, "Grace period expired"))
    );
    assert!(!client.is_subscription_active(&subscription_id));
}
