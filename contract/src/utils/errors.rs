use soroban_sdk::{contracterror, Env, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum IntegrationErrorCode {
    Unauthorized = 1,
    ContractAlreadyRegistered = 2,
    ContractNotRegistered = 3,
    InvalidAddress = 4,
    VersionMustIncrease = 5,
    EventDataTooLarge = 6,
    UnsupportedFunction = 7,
    InvalidPermission = 8,
    InvalidLimit = 9,
    ContractAddressCollision = 10,
    CrossContractCallFailed = 11,
    InvalidEventFilter = 12,
}

pub fn format_error(env: &Env, error_code: IntegrationErrorCode, context: String) -> String {
    if context.len() > 0 {
        return context;
    }

    let prefix = match error_code {
        IntegrationErrorCode::Unauthorized => "unauthorized",
        IntegrationErrorCode::ContractAlreadyRegistered => "contract already registered",
        IntegrationErrorCode::ContractNotRegistered => "contract not registered",
        IntegrationErrorCode::InvalidAddress => "invalid address",
        IntegrationErrorCode::VersionMustIncrease => "version must increase",
        IntegrationErrorCode::EventDataTooLarge => "event data exceeds 1KB",
        IntegrationErrorCode::UnsupportedFunction => "unsupported function",
        IntegrationErrorCode::InvalidPermission => "invalid permission",
        IntegrationErrorCode::InvalidLimit => "invalid limit",
        IntegrationErrorCode::ContractAddressCollision => "contract address collision",
        IntegrationErrorCode::CrossContractCallFailed => "cross-contract call failed",
        IntegrationErrorCode::InvalidEventFilter => "invalid event filter",
    };

    String::from_str(env, prefix)
}
