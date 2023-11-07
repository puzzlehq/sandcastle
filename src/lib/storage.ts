import { generatePublicKey } from "@aztec/aztec.js";
import { Fr, GrumpkinScalar, Point } from "@aztec/circuits.js";
import { SchnorrSignature } from "@aztec/circuits.js/barretenberg";

const ACCOUNTS = 'accounts';
const ENCRYPTION_KEY = 'encryption_key';
export type Account = { name: string, privkey: GrumpkinScalar, pubkey: Point };
type AccountStorage = { name: string, privkey: string, pubkey: string };

export async function seedAccounts() {
  if (!localStorage.getItem(ACCOUNTS)) {
    const pks = Array.from({ length: 3}, () => GrumpkinScalar.random());
    const accounts: Account[] = [
      {
        name: 'Alice',
        privkey: pks[0],
        pubkey: await generatePublicKey(pks[0])
      },
      {
        name: 'Bob',
        privkey: pks[1],
        pubkey: await generatePublicKey(pks[1])
      },
      {
        name: 'Charles',
        privkey: pks[2],
        pubkey: await generatePublicKey(pks[2])
      }
    ];
    const storage: AccountStorage[] = accounts.map(a => ({
      name: a.name,
      privkey: a.privkey.toString(),
      pubkey: a.pubkey.toString()
    }));
    localStorage.setItem(ACCOUNTS, JSON.stringify(storage));
  }
}

export function getAccounts(): Account[] {
  const storage: AccountStorage[] = JSON.parse(localStorage.getItem(ACCOUNTS) ?? '[]');
  return storage.map(s => ({
    name: s.name,
    privkey: GrumpkinScalar.fromString(s.privkey),
    pubkey: Point.fromString(s.pubkey)
  }));
}

export function storeEncryptionKey(key: GrumpkinScalar) {
  localStorage.setItem(ENCRYPTION_KEY, key.toString());
}

export function getEncryptionKey() {
  const keyString = localStorage.getItem(ENCRYPTION_KEY);
  if (keyString) {
    return GrumpkinScalar.fromString(keyString);
  }
  return null;
}

const PROPOSALS = 'proposals';
export type Signature = {
  pubkey: string;
  signature?: SchnorrSignature;
  denied: boolean;
};
export type Proposal = {
  id: number;
  message: Fr;
  signatures: Signature[];
};
export type ProposalStorage = {
  id: number;
  message: string;
  signatures: {
    pubkey: string;
    signature?: string;
    denied: boolean
  }[]
};

export function storeProposals(proposals: Proposal[]) {
  const storage: ProposalStorage[] = proposals.map(p => ({
    id: p.id,
    message: p.message.toString(),
    signatures: p.signatures.map((s: Signature) => {
      return {
        pubkey: s.pubkey.toString(),
        signature: s.signature?.toString(),
        denied: s.denied
      };
    })
  }));
  localStorage.setItem(PROPOSALS, JSON.stringify(storage));
}

export function getProposals(): Proposal[] {
  const storage: ProposalStorage[] = JSON.parse(localStorage.getItem(PROPOSALS) ?? '[]');
  return storage.map(s => ({
    id: s.id,
    message: Fr.fromString(s.message),
    signatures: s.signatures.map(string => {
      return {
        pubkey: string.pubkey,
        signature: string.signature ? SchnorrSignature.fromString(string.signature) : undefined,
        denied: string.denied,
      }
    })
  }));
}
