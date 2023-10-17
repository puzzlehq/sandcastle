import { AuthWitnessProvider, BaseAccountContract, CompleteAddress, Fr, GrumpkinPrivateKey } from "@aztec/aztec.js";
import { Schnorr } from "@aztec/circuits.js/barretenberg";
import { AuthWitness } from "@aztec/types";
import MultiSchnorrAccountContractArtifact from './MultiSchnorr.json' assert { type: 'json' };

export class MultiSchnorrAccountContract extends BaseAccountContract {
  constructor(private privateKey1: GrumpkinPrivateKey, private privateKey2: GrumpkinPrivateKey) {
    super(MultiSchnorrAccountContractArtifact);
  }

  getDeploymentArgs(): Promise<any[]> {
    return Promise.resolve([]);
  }

  getAuthWitnessProvider(_address: CompleteAddress): AuthWitnessProvider {
    const privateKey1 = this.privateKey1;
    const privateKey2 = this.privateKey2;
    return {
      async createAuthWitness(message: Fr): Promise<AuthWitness> {
        /// note: here the wallet is supposed to deserialize the message, maybe prompt the user for signature or do automatic signature?
        const signer1 = await Schnorr.new();
        const signature1 = signer1.constructSignature(message.toBuffer(), privateKey1);
        const signer2 = await Schnorr.new();
        const signature2 = signer2.constructSignature(message.toBuffer(), privateKey2);
        return new AuthWitness(message, [...signature1.toBuffer(), ...signature2.toBuffer()]);
      },
    };
  }
}
