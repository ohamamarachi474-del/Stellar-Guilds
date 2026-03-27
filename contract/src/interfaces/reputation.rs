use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::reputation::types::ReputationProfile;
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReputationContractCall {
    GetReputation(u64, Address),
    GetGlobalReputation(Address),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: ReputationContractCall,
) -> ContractCallResponse {
    match call {
        ReputationContractCall::GetReputation(guild_id, address) => {
            let result = env.try_invoke_contract::<ReputationProfile, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_reputation"),
                vec![env, guild_id.into_val(env), address.into_val(env)],
            );
            match result {
                Ok(Ok(profile)) => Ok(ContractCallResult::ReputationProfile(profile)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        ReputationContractCall::GetGlobalReputation(address) => {
            let result = env.try_invoke_contract::<u64, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_reputation_global"),
                vec![env, address.into_val(env)],
            );
            match result {
                Ok(Ok(score)) => Ok(ContractCallResult::U64(score)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
