#[cfg(test)]
mod tests {
    use crate::upgrade::types::Version;
    use crate::utils::errors::{format_error, IntegrationErrorCode};
    use crate::utils::validation::{is_version_increment, validate_address};
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::xdr::{Hash, ScAddress};
    use soroban_sdk::{Address, Env, String, TryFromVal};

    #[test]
    fn test_format_error_prefers_context_and_prefixes() {
        let env = Env::default();

        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::Unauthorized,
                String::from_str(&env, "custom context"),
            ),
            String::from_str(&env, "custom context")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::InvalidAddress,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "invalid address")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::Unauthorized,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "unauthorized")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::CrossContractCallFailed,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "cross-contract call failed")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::ContractAlreadyRegistered,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "contract already registered")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::ContractNotRegistered,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "contract not registered")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::VersionMustIncrease,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "version must increase")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::EventDataTooLarge,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "event data exceeds 1KB")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::UnsupportedFunction,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "unsupported function")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::InvalidPermission,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "invalid permission")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::InvalidLimit,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "invalid limit")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::ContractAddressCollision,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "contract address collision")
        );
        assert_eq!(
            format_error(
                &env,
                IntegrationErrorCode::InvalidEventFilter,
                String::from_str(&env, ""),
            ),
            String::from_str(&env, "invalid event filter")
        );
    }

    #[test]
    fn test_validation_helpers_cover_address_and_version_rules() {
        let env = Env::default();
        let valid = Address::generate(&env);
        let zero_contract =
            Address::try_from_val(&env, &ScAddress::Contract(Hash([0; 32]))).unwrap();

        assert!(validate_address(&valid));
        assert!(!validate_address(&zero_contract));

        let current = Version::new(1, 2, 3);
        assert!(is_version_increment(&current, &Version::new(2, 0, 0)));
        assert!(is_version_increment(&current, &Version::new(1, 3, 0)));
        assert!(is_version_increment(&current, &Version::new(1, 2, 4)));
        assert!(!is_version_increment(&current, &Version::new(1, 2, 3)));
        assert!(!is_version_increment(&current, &Version::new(1, 2, 2)));
        assert!(!is_version_increment(&current, &Version::new(1, 1, 9)));
    }
}
