use crate::dispute::types::Dispute;
use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeContractCall {
    GetDispute(u64),
    CalculateVoteWeight(u64, Address),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: DisputeContractCall,
) -> ContractCallResponse {
    match call {
        DisputeContractCall::GetDispute(dispute_id) => {
            let result = env.try_invoke_contract::<Dispute, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_dispute"),
                vec![env, dispute_id.into_val(env)],
            );
            match result {
                Ok(Ok(dispute)) => Ok(ContractCallResult::Dispute(dispute)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        DisputeContractCall::CalculateVoteWeight(guild_id, voter) => {
            let result = env.try_invoke_contract::<u32, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "calculate_dispute_vote_weight"),
                vec![env, guild_id.into_val(env), voter.into_val(env)],
            );
            match result {
                Ok(Ok(weight)) => Ok(ContractCallResult::U64(weight as u64)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
