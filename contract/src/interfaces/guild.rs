use crate::guild::types::{Member, Role};
use crate::interfaces::common::{ContractCallResponse, ContractCallResult};
use crate::utils::errors::IntegrationErrorCode;
use soroban_sdk::{contracttype, vec, Address, Env, IntoVal, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GuildContractCall {
    GetMember(u64, Address),
    GetAllMembers(u64),
    IsMember(u64, Address),
    HasPermission(u64, Address, Role),
}

pub fn invoke(
    env: &Env,
    contract_address: &Address,
    call: GuildContractCall,
) -> ContractCallResponse {
    match call {
        GuildContractCall::GetMember(guild_id, address) => {
            let result = env.try_invoke_contract::<Member, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "get_member"),
                vec![env, guild_id.into_val(env), address.into_val(env)],
            );
            match result {
                Ok(Ok(member)) => Ok(ContractCallResult::Member(member)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        GuildContractCall::GetAllMembers(guild_id) => {
            let result = env
                .try_invoke_contract::<soroban_sdk::Vec<Member>, soroban_sdk::InvokeError>(
                    contract_address,
                    &Symbol::new(env, "get_all_members"),
                    vec![env, guild_id.into_val(env)],
                );
            match result {
                Ok(Ok(members)) => Ok(ContractCallResult::Members(members)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        GuildContractCall::IsMember(guild_id, address) => {
            let result = env.try_invoke_contract::<bool, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "is_member"),
                vec![env, guild_id.into_val(env), address.into_val(env)],
            );
            match result {
                Ok(Ok(is_member)) => Ok(ContractCallResult::Bool(is_member)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
        GuildContractCall::HasPermission(guild_id, address, required_role) => {
            let result = env.try_invoke_contract::<bool, soroban_sdk::InvokeError>(
                contract_address,
                &Symbol::new(env, "has_permission"),
                vec![
                    env,
                    guild_id.into_val(env),
                    address.into_val(env),
                    required_role.into_val(env),
                ],
            );
            match result {
                Ok(Ok(has_permission)) => Ok(ContractCallResult::Bool(has_permission)),
                _ => Err(IntegrationErrorCode::CrossContractCallFailed),
            }
        }
    }
}
