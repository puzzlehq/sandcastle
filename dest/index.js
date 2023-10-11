import { AccountManager, BaseAccountContract, Fr, computeMessageSecretHash, createAztecRpcClient, createDebugLogger, getSandboxAccountsWallets, waitForSandbox, } from '@aztec/aztec.js';
import { GrumpkinScalar } from '@aztec/circuits.js';
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
    const initialSupply = 1000000n;
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
    const mintQuantity = 10000n;
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
    constructor(privateKey = PRIVATE_KEY) {
        super(SchnorrHardcodedAccountContractAbi);
        this.privateKey = privateKey;
    }
    getDeploymentArgs() {
        // This contract does not require any arguments in its constructor.
        return Promise.resolve([]);
    }
    getAuthWitnessProvider(_address) {
        const privateKey = this.privateKey;
        return {
            async createAuthWitness(message) {
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
    }
    catch (err) {
        logger(`Failed to send tx: ${err}`);
    }
}
// mainToken();
mainAccount();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLGNBQWMsRUFHZCxtQkFBbUIsRUFDbkIsRUFBRSxFQUNGLHdCQUF3QixFQUN4QixvQkFBb0IsRUFDcEIsaUJBQWlCLEVBQ2pCLHlCQUF5QixFQUV6QixjQUFjLEdBQ2YsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QixPQUFPLEVBQXVDLGNBQWMsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3pGLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUMxRCxPQUFPLEVBQUUsa0NBQWtDLEVBQUUsYUFBYSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDaEcsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUUzQyxNQUFNLEVBQUUsV0FBVyxHQUFHLHVCQUF1QixFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUU5RCxLQUFLLFVBQVUsU0FBUztJQUN4QixpRkFBaUY7SUFDN0UsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDL0MsTUFBTSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVuQyx5REFBeUQ7SUFDekQsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbkQsK0JBQStCO0lBQy9CLE1BQU0sY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRS9CLE1BQU0sUUFBUSxHQUFHLE1BQU0sUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRTlDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV4QyxpRUFBaUU7SUFDakUsOERBQThEO0lBQzlELE1BQU0sUUFBUSxHQUFHLE1BQU0seUJBQXlCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0QsTUFBTSxLQUFLLEdBQUcs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