import { type AuthWitnessProvider, BaseAccountContract, CompleteAddress, Fr, Point } from "@aztec/aztec.js";
import { AuthWitness } from "@aztec/types";
import MultiSchnorrAccountContractArtifact from './artifacts/MultiSchnorr.json' assert { type: 'json' };
import { getProposals } from "./lib/storage.ts";
import { SchnorrSignature } from "@aztec/circuits.js/barretenberg";

export class MultiSchnorrAccountContract extends BaseAccountContract {
  constructor(private pubkey1: Point, private pubkey2: Point, private pubkey3: Point) {
    /* @ts-ignore next-line */
    super(MultiSchnorrAccountContractArtifact);
  }

  async getDeploymentArgs(): Promise<any[]> {
    return Promise.resolve([
      ...this.pubkey1.toFields(),
      ...this.pubkey2.toFields(),
      ...this.pubkey3.toFields()
    ]);
  }

  getAuthWitnessProvider(_address: CompleteAddress): AuthWitnessProvider {
    const proposals = getProposals();
    return {
      async createAuthWitness(message: Fr): Promise<AuthWitness> {
        const proposal = proposals.find(p => p.message.equals(message));
        if (proposal) {
          const signatures = proposal.signatures.flatMap(s => s.signature).filter(s => !!s) as SchnorrSignature[];
          return new AuthWitness(message, signatures.map(s => s.toFields()).flat());
        }
        return new AuthWitness(message, []);
      },
    };
  }
}
