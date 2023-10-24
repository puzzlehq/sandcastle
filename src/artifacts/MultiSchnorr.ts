
/* Autogenerated file, do not edit! */

/* eslint-disable */
import {
  AztecAddress,
  AztecAddressLike,
  CompleteAddress,
  Contract,
  ContractArtifact,
  ContractBase,
  ContractFunctionInteraction,
  ContractMethod,
  DeployMethod,
  EthAddress,
  EthAddressLike,
  FieldLike,
  Fr,
  PXE,
  Point,
  PublicKey,
  Wallet,
} from '@aztec/aztec.js';
import MultiSchnorrContractArtifactJson from './MultiSchnorr.json' assert { type: 'json' };
export const MultiSchnorrContractArtifact = MultiSchnorrContractArtifactJson as ContractArtifact;

/**
 * Type-safe interface for contract MultiSchnorr;
 */
export class MultiSchnorrContract extends ContractBase {
  
  private constructor(
    completeAddress: CompleteAddress,
    wallet: Wallet,
    portalContract = EthAddress.ZERO
  ) {
    super(completeAddress, MultiSchnorrContractArtifact, wallet, portalContract);
  }
  

  
  /**
   * Creates a contract instance.
   * @param address - The deployed contract's address.
   * @param wallet - The wallet to use when interacting with the contract.
   * @returns A promise that resolves to a new Contract instance.
   */
  public static async at(
    address: AztecAddress,
    wallet: Wallet,
  ) {
    return Contract.at(address, MultiSchnorrContract.artifact, wallet) as Promise<MultiSchnorrContract>;
  }

  
  /**
   * Creates a tx to deploy a new instance of this contract.
   */
  public static deploy(pxe: PXE, signing_pub_key_x_0: FieldLike, signing_pub_key_y_0: FieldLike, signing_pub_key_x_1: FieldLike, signing_pub_key_y_1: FieldLike) {
    return new DeployMethod<MultiSchnorrContract>(Point.ZERO, pxe, MultiSchnorrContractArtifact, Array.from(arguments).slice(1));
  }

  /**
   * Creates a tx to deploy a new instance of this contract using the specified public key to derive the address.
   */
  public static deployWithPublicKey(pxe: PXE, publicKey: PublicKey, signing_pub_key_x_0: FieldLike, signing_pub_key_y_0: FieldLike, signing_pub_key_x_1: FieldLike, signing_pub_key_y_1: FieldLike) {
    return new DeployMethod<MultiSchnorrContract>(publicKey, pxe, MultiSchnorrContractArtifact, Array.from(arguments).slice(2));
  }
  

  
  /**
   * Returns this contract's artifact.
   */
  public static get artifact(): ContractArtifact {
    return MultiSchnorrContractArtifact;
  }
  

  /** Type-safe wrappers for the public methods exposed by the contract. */
  public methods!: {
    
    /** compute_note_hash_and_nullifier(contract_address: field, nonce: field, storage_slot: field, preimage: array) */
    compute_note_hash_and_nullifier: ((contract_address: FieldLike, nonce: FieldLike, storage_slot: FieldLike, preimage: FieldLike[]) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** entrypoint(payload: struct) */
    entrypoint: ((payload: { function_calls: { args_hash: FieldLike, function_selector: FieldLike, target_address: FieldLike, is_public: boolean }[], nonce: FieldLike }) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** is_valid(message_hash: field) */
    is_valid: ((message_hash: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** is_valid_public(message_hash: field) */
    is_valid_public: ((message_hash: FieldLike) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;

    /** set_is_valid_storage(message_hash: field, value: boolean) */
    set_is_valid_storage: ((message_hash: FieldLike, value: boolean) => ContractFunctionInteraction) & Pick<ContractMethod, 'selector'>;
  };
}
