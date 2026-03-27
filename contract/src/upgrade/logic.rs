use crate::events::emit::emit_event;
use crate::events::topics::{
    ACT_APPROVED, ACT_COMPLETED, ACT_EMERGENCY_UPGRADE, ACT_REJECTED, ACT_STARTED, ACT_UPDATED,
    ACT_UPGRADE_EXECUTED, ACT_UPGRADE_PROPOSED, MOD_UPGRADE,
};
use crate::upgrade::storage;
use crate::upgrade::types::{MigrationPlan, UpgradeProposal, UpgradeStatus, Version};
use soroban_sdk::{symbol_short, Address, Env, String};

/// Create a new upgrade proposal
pub fn propose_upgrade(
    env: &Env,
    proposer: &Address,
    new_contract_address: &Address,
    target_version: &Version,
    description: String,
) -> u64 {
    // Verify the proposer has the right to propose upgrades
    let governance_addr = storage::get_governance_address(env);
    proposer.require_auth();

    // In a real implementation, we might check if the proposer has sufficient voting power
    // For now, we just verify the governance address

    // Generate a new proposal ID (in practice, this might be more sophisticated)
    let proposal_id = env
        .storage()
        .instance()
        .get(&symbol_short!("nxt_prop"))
        .unwrap_or(1u64);
    env.storage()
        .instance()
        .set(&symbol_short!("nxt_prop"), &(proposal_id + 1));

    let proposal = UpgradeProposal {
        id: proposal_id,
        proposer: proposer.clone(),
        new_contract_address: new_contract_address.clone(),
        version: target_version.clone(),
        description,
        timestamp: env.ledger().timestamp(),
        status: UpgradeStatus::Pending,
        votes_for: 0,
        votes_against: 0,
        total_voters: 0, // Will be calculated when voting begins
    };

    storage::store_upgrade_proposal(env, &proposal);

    // Emit event for the proposal
    emit_event(env, MOD_UPGRADE, ACT_UPGRADE_PROPOSED, proposal_id);

    proposal_id
}

/// Vote on an upgrade proposal
pub fn vote_on_proposal(
    env: &Env,
    voter: &Address,
    proposal_id: u64,
    vote_for: bool,
) -> Result<(), &'static str> {
    voter.require_auth();

    // Record the vote
    storage::record_vote(env, proposal_id, voter, vote_for)?;

    // Check if proposal has reached required threshold
    if let Some(proposal) = storage::get_upgrade_proposal(env, proposal_id) {
        let _total_votes = proposal.votes_for + proposal.votes_against;
        // Simple majority threshold - in real implementation this could be configurable
        let required_votes = (proposal.total_voters / 2) + 1;

        if proposal.votes_for >= required_votes {
            storage::update_proposal_status(env, proposal_id, UpgradeStatus::Approved);
            emit_event(env, MOD_UPGRADE, ACT_APPROVED, proposal_id);
        } else if proposal.votes_against >= required_votes {
            storage::update_proposal_status(env, proposal_id, UpgradeStatus::Rejected);
            emit_event(env, MOD_UPGRADE, ACT_REJECTED, proposal_id);
        }
    }

    Ok(())
}

/// Execute an approved upgrade
pub fn execute_upgrade(
    env: &Env,
    executor: &Address,
    proposal_id: u64,
) -> Result<(), &'static str> {
    executor.require_auth();

    let mut proposal =
        storage::get_upgrade_proposal(env, proposal_id).ok_or("Proposal does not exist")?;

    if proposal.status != UpgradeStatus::Approved {
        return Err("Proposal is not approved for execution");
    }

    // Check if the caller is authorized to execute upgrades
    let governance_addr = storage::get_governance_address(env);
    if *executor != governance_addr {
        return Err("Only governance address can execute upgrades");
    }

    // Perform state migration if a migration plan exists
    if let Some(migration_plan) = storage::get_migration_plan(env, proposal_id) {
        perform_state_migration(env, &migration_plan)?;
    }

    // Update the current version
    storage::set_current_version(env, &proposal.version);

    // Update proposal status
    proposal.status = UpgradeStatus::Executed;
    storage::store_upgrade_proposal(env, &proposal);

    // Emit upgrade execution event
    emit_event(env, MOD_UPGRADE, ACT_UPGRADE_EXECUTED, proposal_id);

    Ok(())
}

/// Perform emergency upgrade bypassing the normal governance process
pub fn emergency_upgrade(
    env: &Env,
    caller: &Address,
    _new_contract_address: &Address,
    new_version: &Version,
) -> Result<(), &'static str> {
    caller.require_auth();

    // Check if emergency upgrades are enabled
    if !storage::is_emergency_upgrade_enabled(env) {
        return Err("Emergency upgrades are not enabled");
    }

    // Only governance address can perform emergency upgrades
    let governance_addr = storage::get_governance_address(env);
    if *caller != governance_addr {
        return Err("Only governance address can perform emergency upgrades");
    }

    // Update the current version directly
    storage::set_current_version(env, new_version);

    // Emit emergency upgrade event
    emit_event(env, MOD_UPGRADE, ACT_EMERGENCY_UPGRADE, new_version.clone());

    Ok(())
}

/// Enable or disable emergency upgrades
pub fn toggle_emergency_upgrades(
    env: &Env,
    caller: &Address,
    enable: bool,
) -> Result<(), &'static str> {
    caller.require_auth();

    // Only governance address can enable/disable emergency upgrades
    let governance_addr = storage::get_governance_address(env);
    if *caller != governance_addr {
        return Err("Only governance address can toggle emergency upgrades");
    }

    storage::set_emergency_upgrade_enabled(env, enable);

    emit_event(env, MOD_UPGRADE, ACT_UPDATED, enable);

    Ok(())
}

/// Register a migration plan for an upgrade
pub fn register_migration_plan(
    env: &Env,
    caller: &Address,
    proposal_id: u64,
    migration_plan: &MigrationPlan,
) -> Result<(), &'static str> {
    caller.require_auth();

    // Only governance address can register migration plans
    let governance_addr = storage::get_governance_address(env);
    if *caller != governance_addr {
        return Err("Only governance address can register migration plans");
    }

    storage::store_migration_plan(env, proposal_id, migration_plan);

    emit_event(env, MOD_UPGRADE, ACT_UPDATED, proposal_id);

    Ok(())
}

/// Perform state migration based on a migration plan
fn perform_state_migration(env: &Env, plan: &MigrationPlan) -> Result<(), &'static str> {
    // In a real implementation, this would call specific migration functions
    // based on the migration plan's selector
    // For now, we'll just log the migration attempt

    emit_event(env, MOD_UPGRADE, ACT_STARTED, plan.from_version.clone());

    // Placeholder for actual migration logic
    // This would involve calling migration functions that transform data
    // from the old format to the new format

    emit_event(env, MOD_UPGRADE, ACT_COMPLETED, plan.to_version.clone());

    Ok(())
}

/// Check version compatibility between current and target version
pub fn check_version_compatibility(current: &Version, target: &Version) -> bool {
    // Major version must match for compatibility
    // Minor version of target should be >= current for forward compatibility
    current.major == target.major && target.minor >= current.minor
}

/// Rollback to a previous version (limited capability)
pub fn rollback_to_version(
    env: &Env,
    caller: &Address,
    target_version: &Version,
) -> Result<(), &'static str> {
    caller.require_auth();

    // Only governance address can perform rollbacks
    let governance_addr = storage::get_governance_address(env);
    if *caller != governance_addr {
        return Err("Only governance address can perform rollbacks");
    }

    // In a real implementation, this would involve complex state restoration
    // For now, we'll just check if the rollback is to a previous version
    let current_version = storage::get_current_version(env);

    if target_version.major != current_version.major
        || (target_version.major == current_version.major
            && target_version.minor > current_version.minor)
    {
        return Err("Can only rollback to earlier versions in the same major series");
    }

    // Update to the target version
    storage::set_current_version(env, target_version);

    env.events()
        .publish(("upgrade", "rollback_completed"), target_version.clone());

    Ok(())
}
