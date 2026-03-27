use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::payment::types::DistributionStatus;
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentContractCall {
    GetPoolStatus(u64),
    GetRecipientAmount(u64, Address),
    ValidateDistribution(u64),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: PaymentContractCall,
) -> ContractCallResponse {
    match call {
        PaymentContractCall::GetPoolStatus(pool_id) => {
            let result = env.try_invoke_contract::<DistributionStatus, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_pool_status"),
                vec![env, pool_id.into_val(env)],
            );
            match result {
                Ok(Ok(status)) => Ok(ContractCallResult::DistributionStatus(status)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        PaymentContractCall::GetRecipientAmount(pool_id, recipient) => {
            let result = env.try_invoke_contract::<i128, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_recipient_amount"),
                vec![env, pool_id.into_val(env), recipient.into_val(env)],
            );
            match result {
                Ok(Ok(amount)) => Ok(ContractCallResult::I128(amount)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        PaymentContractCall::ValidateDistribution(pool_id) => {
            let result = env.try_invoke_contract::<bool, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "validate_distribution"),
                vec![env, pool_id.into_val(env)],
            );
            match result {
                Ok(Ok(valid)) => Ok(ContractCallResult::Bool(valid)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
