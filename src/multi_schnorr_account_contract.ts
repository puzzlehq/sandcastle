import { type AuthWitnessProvider, BaseAccountContract, CompleteAddress, Fr, Point } from "@aztec/aztec.js";
import { SchnorrSignature } from "@aztec/circuits.js/barretenberg";
import { AuthWitness } from "@aztec/types";
import MultiSchnorrAccountContractArtifact from './artifacts/MultiSchnorr.json' assert { type: 'json' };

export class MultiSchnorrAccountContract extends BaseAccountContract {
  signatures: SchnorrSignature[] = [];

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
    const sigBuffers = this.signatures.map(s => s.toFields());
    return {
      async createAuthWitness(message: Fr): Promise<AuthWitness> {
        return new AuthWitness(message, sigBuffers.flat());
      },
    };
  }

  /// note: where/how can i call this? or is this the wrong approach?
  addSignature(signature: SchnorrSignature) {
    this.signatures.push(signature);
  }
}
