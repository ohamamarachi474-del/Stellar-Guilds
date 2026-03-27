use crate::bounty::types::Bounty;
use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyContractCall {
    GetBounty(u64),
    GetGuildBounties(u64),
    ExpireBounty(u64),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: BountyContractCall,
) -> ContractCallResponse {
    match call {
        BountyContractCall::GetBounty(bounty_id) => {
            let result = env.try_invoke_contract::<Bounty, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_bounty_data"),
                vec![env, bounty_id.into_val(env)],
            );
            match result {
                Ok(Ok(bounty)) => Ok(ContractCallResult::Bounty(bounty)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        BountyContractCall::GetGuildBounties(guild_id) => {
            let result = env
                .try_invoke_contract::<soroban_sdk::Vec<Bounty>, soroban_sdk::InvokeError>(
                    contract_address,
                    &Symbol::new(env, "get_guild_bounties_list"),
                    vec![env, guild_id.into_val(env)],
                );
            match result {
                Ok(Ok(bounties)) => Ok(ContractCallResult::Bounties(bounties)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        BountyContractCall::ExpireBounty(bounty_id) => {
            let result = env.try_invoke_contract::<bool, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "expire_bounty"),
                vec![env, bounty_id.into_val(env)],
            );
            match result {
                Ok(Ok(expired)) => Ok(ContractCallResult::Bool(expired)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
