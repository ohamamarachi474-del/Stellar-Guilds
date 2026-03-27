use crate::upgrade::types::Version;
use soroban_sdk::Address;

pub fn validate_address(address: &Address) -> bool {
    if address.to_string().len() == 0 {
        return false;
    }

    #[cfg(not(target_family = "wasm"))]
    {
        use soroban_sdk::xdr::{AccountId, PublicKey, ScAddress, Uint256};

        let sc_address: ScAddress = address.clone().into();
        match sc_address {
            ScAddress::Account(AccountId(PublicKey::PublicKeyTypeEd25519(Uint256(bytes)))) => {
                bytes.iter().any(|byte| *byte != 0)
            }
            ScAddress::Contract(hash) => hash.0.iter().any(|byte| *byte != 0),
        }
    }

    #[cfg(target_family = "wasm")]
    {
        true
    }
}

pub fn is_version_increment(current: &Version, next: &Version) -> bool {
    if next.major > current.major {
        return true;
    }
    if next.major < current.major {
        return false;
    }

    if next.minor > current.minor {
        return true;
    }
    if next.minor < current.minor {
        return false;
    }

    next.patch > current.patch
}
