use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::subscription::types::Subscription;
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SubscriptionContractCall {
    GetSubscription(u64),
    IsSubscriptionActive(u64),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: SubscriptionContractCall,
) -> ContractCallResponse {
    match call {
        SubscriptionContractCall::GetSubscription(subscription_id) => {
            let result = env.try_invoke_contract::<Subscription, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_subscription"),
                vec![env, subscription_id.into_val(env)],
            );
            match result {
                Ok(Ok(subscription)) => Ok(ContractCallResult::Subscription(subscription)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        SubscriptionContractCall::IsSubscriptionActive(subscription_id) => {
            let result = env.try_invoke_contract::<bool, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "is_subscription_active"),
                vec![env, subscription_id.into_val(env)],
            );
            match result {
                Ok(Ok(active)) => Ok(ContractCallResult::Bool(active)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
