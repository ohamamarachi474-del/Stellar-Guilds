use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::treasury::types::{Transaction, Treasury};
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TreasuryContractCall {
    GetTreasury(u64),
    GetTreasuryBalance(u64, Option<Address>),
    GetTransactionHistory(u64, u32),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: TreasuryContractCall,
) -> ContractCallResponse {
    match call {
        TreasuryContractCall::GetTreasury(treasury_id) => {
            let result = env.try_invoke_contract::<Treasury, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_treasury"),
                vec![env, treasury_id.into_val(env)],
            );
            match result {
                Ok(Ok(treasury)) => Ok(ContractCallResult::Treasury(treasury)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        TreasuryContractCall::GetTreasuryBalance(treasury_id, token) => {
            let result = env.try_invoke_contract::<i128, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_treasury_balance"),
                vec![env, treasury_id.into_val(env), token.into_val(env)],
            );
            match result {
                Ok(Ok(balance)) => Ok(ContractCallResult::I128(balance)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        TreasuryContractCall::GetTransactionHistory(treasury_id, limit) => {
            let result = env
                .try_invoke_contract::<soroban_sdk::Vec<Transaction>, soroban_sdk::InvokeError>(
                    contract_address,
                    &Symbol::new(env, "get_transaction_history"),
                    vec![env, treasury_id.into_val(env), limit.into_val(env)],
                );
            match result {
                Ok(Ok(history)) => Ok(ContractCallResult::Transactions(history)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
