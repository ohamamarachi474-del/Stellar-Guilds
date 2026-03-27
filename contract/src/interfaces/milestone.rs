use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::milestone::types::Milestone;
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneContractCall {
    GetMilestone(u64),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: MilestoneContractCall,
) -> ContractCallResponse {
    match call {
        MilestoneContractCall::GetMilestone(milestone_id) => {
            let result = env.try_invoke_contract::<Milestone, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_milestone"),
                vec![env, milestone_id.into_val(env)],
            );
            match result {
                Ok(Ok(milestone)) => Ok(ContractCallResult::Milestone(milestone)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
