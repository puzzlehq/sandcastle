import {
  AccountManager,
  AuthWitnessProvider,
  AztecRPC,
  BaseAccountContract,
  Fr,
  computeMessageSecretHash,
  createAztecRpcClient,
  createDebugLogger,
  getSandboxAccountsWallets,
  getSchnorrAccount,
  waitForSandbox,
} from '@aztec/aztec.js';
import { CompleteAddress, GrumpkinPrivateKey, GrumpkinScalar } from '@aztec/circuits.js';
import { Schnorr } from '@aztec/circuits.js/barretenberg';
import { SchnorrHardcodedAccountContractAbi, TokenContract } from '@aztec/noir-contracts/types';
import { AuthWitness } from '@aztec/types';

const { SANDBOX_URL = 'http://localhost:8080' } = process.env;

async function mainToken() {
////////////// CREATE THE CLIENT INTERFACE AND CONTACT THE SANDBOX //////////////
    const logger = createDebugLogger('sandcastle');
    logger('SANDBOX_URL', SANDBOX_URL);

    // We create AztecRPC client connected to the sandbox URL
    const aztecRpc = createAztecRpcClient(SANDBOX_URL);
    // Wait for sandbox to be ready
    await waitForSandbox(aztecRpc);

    const nodeInfo = await aztecRpc.getNodeInfo();

    logger('Aztec Sandbox Info ', nodeInfo);

    ////////////// LOAD SOME ACCOUNTS FROM THE SANDBOX //////////////
    // The sandbox comes with a set of created accounts. Load them
    const accounts = await getSandboxAccountsWallets(aztecRpc);
    const alice = accounts[0].getAddress();
    const bob = accounts[1].getAddress();
    logger(`Loaded alice's account at ${alice.toShortString()}`);
    logger(`Loaded bob's account at ${bob.toShortString()}`);

    ////////////// DEPLOY OUR TOKEN CONTRACT //////////////

    // Deploy a token contract, create a contract abstraction object and link it to the owner's wallet
    const initialSupply = 1_000_000n;

    logger(`Deploying token contract minting an initial ${initialSupply} tokens to Alice...`);
    const contract = await TokenContract.deploy(aztecRpc).send().deployed();

    // Create the contract abstraction and link to Alice's wallet for future signing
    const tokenContractAlice = await TokenContract.at(contract.address, await accounts[0]);

    // Initialize the contract and add Bob as a minter
    await tokenContractAlice.methods._initialize({ address: alice }).send().wait();
    await tokenContractAlice.methods.set_minter({ address: bob }, true).send().wait();

    logger(`Contract successfully deployed at address ${contract.address.toShortString()}`);

    const secret = Fr.random();
    const secretHash = await computeMessageSecretHash(secret);

    await tokenContractAlice.methods.mint_private(initialSupply, secretHash).send().wait();
    await tokenContractAlice.methods.redeem_shield({ address: alice }, initialSupply, secret).send().wait();

    ////////////// QUERYING THE TOKEN BALANCE FOR EACH ACCOUNT //////////////

    // Bob wants to mint some funds, the contract is already deployed, create an abstraction and link it his wallet
    // Since we already have a token link, we can simply create a new instance of the contract linked to Bob's wallet
    const tokenContractBob = tokenContractAlice.withWallet(await accounts[1]);

    let aliceBalance = await tokenContractAlice.methods.balance_of_private({ address: alice }).view();
    logger(`Alice's balance ${aliceBalance}`);

    let bobBalance = await tokenContractBob.methods.balance_of_private({ address: bob }).view();
    logger(`Bob's balance ${bobBalance}`);

    ////////////// TRANSFER FUNDS FROM ALICE TO BOB //////////////

    // We will now transfer tokens from ALice to Bob
    const transferQuantity = 543n;
    logger(`Transferring ${transferQuantity} tokens from Alice to Bob...`);
    await tokenContractAlice.methods.transfer({ address: alice }, { address: bob }, transferQuantity, 0).send().wait();

    // Check the new balances
    aliceBalance = await tokenContractAlice.methods.balance_of_private({ address: alice }).view();
    logger(`Alice's balance ${aliceBalance}`);

    bobBalance = await tokenContractBob.methods.balance_of_private({ address: bob }).view();
    logger(`Bob's balance ${bobBalance}`);

    ////////////// MINT SOME MORE TOKENS TO BOB'S ACCOUNT //////////////

    // Now mint some further funds for Bob
    const mintQuantity = 10_000n;
    logger(`Minting ${mintQuantity} tokens to Bob...`);
    await tokenContractBob.methods.mint_private(mintQuantity, secretHash).send().wait();
    await tokenContractBob.methods.redeem_shield({ address: bob }, mintQuantity, secret).send().wait();

    // Check the new balances
    aliceBalance = await tokenContractAlice.methods.balance_of_private({ address: alice }).view();
    logger(`Alice's balance ${aliceBalance}`);

    bobBalance = await tokenContractBob.methods.balance_of_private({ address: bob }).view();
    logger(`Bob's balance ${bobBalance}`);
}

////// ACCCOUNT STUFF

const PRIVATE_KEY = GrumpkinScalar.fromString('0xd35d743ac0dfe3d6dbe6be8c877cb524a00ab1e3d52d7bada095dfc8894ccfa');

/** Account contract implementation that authenticates txs using Schnorr signatures. */
class SchnorrHardcodedKeyAccountContract extends BaseAccountContract {
  constructor(private privateKey: GrumpkinPrivateKey = PRIVATE_KEY) {
    super(SchnorrHardcodedAccountContractAbi);
  }

  getDeploymentArgs(): Promise<any[]> {
    // This contract does not require any arguments in its constructor.
    return Promise.resolve([]);
  }

  getAuthWitnessProvider(_address: CompleteAddress): AuthWitnessProvider {
    const privateKey = this.privateKey;
    return {
      async createAuthWitness(message: Fr): Promise<AuthWitness> {
        const signer = await Schnorr.new();
        const signature = signer.constructSignature(message.toBuffer(), privateKey);
        return new AuthWitness(message, [...signature.toBuffer()]);
      },
    };
  }
}

async function mainAccount() {
  const logger = createDebugLogger('sandcastle');
  logger('SANDBOX_URL', SANDBOX_URL);

  // We create AztecRPC client connected to the sandbox URL
  const rpc = createAztecRpcClient(SANDBOX_URL);
  // Wait for sandbox to be ready
  await waitForSandbox(rpc);

  const nodeInfo = await rpc.getNodeInfo();

  logger('Aztec Sandbox Info ', nodeInfo);

  const encryptionPrivateKey = GrumpkinScalar.random();
  const account = new AccountManager(rpc, encryptionPrivateKey, new SchnorrHardcodedKeyAccountContract());
  const wallet = await account.waitDeploy();
  const address = wallet.getCompleteAddress().address;

  /// initialize token contract and mint some tokens
  const token = await TokenContract.deploy(wallet).send().deployed();
  logger(`Deployed token contract at ${token.address}`);
  await token.methods._initialize({ address }).send().wait();

  const secret = Fr.random();
  const secretHash = await computeMessageSecretHash(secret);

  await token.methods.mint_private(50, secretHash).send().wait();
  await token.methods.redeem_shield({ address }, 50, secret).send().wait();

  const balance = await token.methods.balance_of_private({ address }).view();
  logger(`Balance of wallet is now ${balance}`);

  /// try with a wrong key
  const walletAddress = wallet.getCompleteAddress();
  const wrongKey = GrumpkinScalar.random();
  const wrongAccountContract = new SchnorrHardcodedKeyAccountContract(wrongKey);
  const wrongAccount = new AccountManager(rpc, encryptionPrivateKey, wrongAccountContract, walletAddress);
  const wrongWallet = await wrongAccount.getWallet();
  const tokenWithWrongWallet = token.withWallet(wrongWallet);

  try {
    await tokenWithWrongWallet.methods.mint_private(200, secretHash).simulate();
  } catch (err) {
    logger(`Failed to send tx: ${err}`);
  }
}

// mainToken();
mainAccount();
