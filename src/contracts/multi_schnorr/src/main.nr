mod public_key_note;

contract MultiSchnorr {
  use dep::std;
  use dep::std::option::Option;

  use dep::aztec::{
    abi::{ PrivateCircuitPublicInputs, PrivateContextInputs, Hasher },
    constants_gen::GENERATOR_INDEX__SIGNATURE_PAYLOAD,
    context::{PrivateContext, PublicContext, Context},
    log::emit_encrypted_log,
    note::{ note_header::NoteHeader, utils as note_utils, note_getter_options::NoteGetterOptions },
    oracle::{ get_public_key::get_public_key },
    state_vars::{ immutable_singleton::ImmutableSingleton, set::Set },
    types::{ vec::BoundedVec, point::Point },
  };

  use dep::authwit:: {
    entrypoint::{ EntrypointPayload, ENTRYPOINT_PAYLOAD_SIZE },
    account::AccountActions,
    auth_witness::get_auth_witness,
  };

  use crate::public_key_note::{PublicKeyNote, PublicKeyNoteMethods, PUBLIC_KEY_NOTE_LEN};

  struct Storage {
    signers: Set<PublicKeyNote, PUBLIC_KEY_NOTE_LEN>,
  }

  impl Storage {
    fn init(context: Context) -> Self {
      Storage { 
        signers: Set::new(context, 1, PublicKeyNoteMethods),
      }
    }
  }

  global ACCOUNT_ACTIONS_STORAGE_SLOT = 2;

  #[aztec(private)]
  fn constructor(
    signing_pub_key_x_0: pub Field,
    signing_pub_key_y_0: pub Field,
    signing_pub_key_x_1: pub Field,
    signing_pub_key_y_1: pub Field,
    signing_pub_key_x_2: pub Field,
    signing_pub_key_y_2: pub Field,
  ) {
    let this = context.this_address();

    let mut pub_key_note_0 = PublicKeyNote::new(signing_pub_key_x_0, signing_pub_key_y_0, this);
    let mut pub_key_note_1 = PublicKeyNote::new(signing_pub_key_x_1, signing_pub_key_y_1, this);
    let mut pub_key_note_2 = PublicKeyNote::new(signing_pub_key_x_2, signing_pub_key_y_2, this);
    storage.signers.insert(&mut pub_key_note_0, true);
    storage.signers.insert(&mut pub_key_note_1, true);
    storage.signers.insert(&mut pub_key_note_2, true);
  }

  #[aztec(private)]
  fn entrypoint(payload: pub EntrypointPayload) {
    let actions = AccountActions::private(&mut context, ACCOUNT_ACTIONS_STORAGE_SLOT, is_valid_impl);
    actions.entrypoint(payload);
  }

  #[aztec(private)]
  fn is_valid(message_hash: Field) -> Field {
    let actions = AccountActions::private(&mut context, ACCOUNT_ACTIONS_STORAGE_SLOT, is_valid_impl);
    actions.is_valid(message_hash)
  }

  #[aztec(public)]
  fn is_valid_public(message_hash: Field) -> Field {
    let actions = AccountActions::public(&mut context, ACCOUNT_ACTIONS_STORAGE_SLOT, is_valid_impl);
    actions.is_valid_public(message_hash)
  }

  #[aztec(public)]
  internal fn set_is_valid_storage(message_hash: Field, value: bool) {
    let actions = AccountActions::public(&mut context, ACCOUNT_ACTIONS_STORAGE_SLOT, is_valid_impl);
    actions.internal_set_is_valid_storage(message_hash, value)
  }

  #[contract_library_method]
  fn is_valid_impl(context: &mut PrivateContext, message_hash: Field) -> pub bool {
    // Load public key from storage
    let storage = Storage::init(Context::private(context));
    let public_keys = storage.signers.get_notes(NoteGetterOptions::new());

    // Load auth witness
    let witness: [Field; 64] = get_auth_witness(message_hash);

    for public_key in public_keys {
      let public_key = public_key.unwrap();

      let mut signature: [u8; 64] = [0; 64];
      for i in 0..64 { signature[i] = witness[i] as u8; }

      // Verify signature of the payload bytes
      let verification = std::schnorr::verify_signature(public_key.x, public_key.y, signature, message_hash.to_be_bytes(32));
      assert(verification == true);
    }

    true
  }

  // Computes notes hash and nullifier.
  // Note 1: Needs to be defined by every contract producing logs.
  // Note 2: Having it in all the contracts gives us the ability to compute the note hash and nullifier differently for different kind of notes.
  unconstrained fn compute_note_hash_and_nullifier(contract_address: Field, nonce: Field, storage_slot: Field, preimage: [Field; PUBLIC_KEY_NOTE_LEN]) -> [Field; 4] {
    assert(storage_slot == 1);
    let note_header = NoteHeader::new(contract_address, nonce, storage_slot);
    note_utils::compute_note_hash_and_nullifier(PublicKeyNoteMethods, note_header, preimage)
  }
}
