use crate::governance::types::Proposal;
use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GovernanceContractCall {
    GetProposal(u64),
    GetActiveProposals(u64),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: GovernanceContractCall,
) -> ContractCallResponse {
    match call {
        GovernanceContractCall::GetProposal(proposal_id) => {
            let result = env.try_invoke_contract::<Proposal, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_proposal"),
                vec![env, proposal_id.into_val(env)],
            );
            match result {
                Ok(Ok(proposal)) => Ok(ContractCallResult::Proposal(proposal)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        GovernanceContractCall::GetActiveProposals(guild_id) => {
            let result = env
                .try_invoke_contract::<soroban_sdk::Vec<Proposal>, soroban_sdk::InvokeError>(
                    contract_address,
                    &Symbol::new(env, "get_active_proposals"),
                    vec![env, guild_id.into_val(env)],
                );
            match result {
                Ok(Ok(proposals)) => Ok(ContractCallResult::Proposals(proposals)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
