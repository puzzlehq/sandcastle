import {
  AccountManager,
  Fr,
  computeMessageSecretHash,
  createPXEClient,
  waitForSandbox,
} from '@aztec/aztec.js';
import { GrumpkinScalar } from '@aztec/circuits.js';
import { TokenContract } from '@aztec/noir-contracts/types';
import { MultiSchnorrAccountContract } from './multi_schnorr_account_contract.js';
import debug from 'debug';

const { SANDBOX_URL = 'http://localhost:8080' } = process.env;
const logger = debug('sandcastle');
const PRIVATE_KEY_1 = GrumpkinScalar.fromString('0xd35d743ac0dfe3d6dbe6be8c877cb524a00ab1e3d52d7bada095dfc8894ccfa');
const PRIVATE_KEY_2 = GrumpkinScalar.fromString('0xd35d743ac0dfe3d6dbe6be8c877cb524b00ab1e3d52d7bada095dfc8894ccfa');

async function main() {
  logger('SANDBOX_URL', SANDBOX_URL);
  const pxe = createPXEClient(SANDBOX_URL);
  await waitForSandbox(pxe);

  const nodeInfo = await pxe.getNodeInfo();

  logger('sandbox info', nodeInfo);

  const encryptionPrivateKey = GrumpkinScalar.random();
  const account = new AccountManager(pxe, encryptionPrivateKey, new MultiSchnorrAccountContract(PRIVATE_KEY_1, PRIVATE_KEY_2));
  const wallet = await account.waitDeploy();
  const address = wallet.getCompleteAddress().address;

  /// initialize token contract and mint some tokens
  const token = await TokenContract.deploy(wallet, { address }).send().deployed();
  logger(`Deployed token contract at ${token.address}`);
  await token.methods._initialize({ address }).send().wait();

  const secret = Fr.random();
  const secretHash = await computeMessageSecretHash(secret);

  await token.methods.mint_private(50, secretHash).send().wait();
  await token.methods.redeem_shield({ address }, 50, secret).send().wait();

  const balance = await token.methods.balance_of_private({ address }).view();
  logger(`Balance of wallet is now ${balance}`);

  /// try with wrong keys
  const walletAddress = wallet.getCompleteAddress();
  const wrongKey1 = GrumpkinScalar.random();
  const wrongKey2 = GrumpkinScalar.random();
  const wrongAccountContract = new MultiSchnorrAccountContract(wrongKey1, wrongKey2);
  const wrongAccount = new AccountManager(pxe, encryptionPrivateKey, wrongAccountContract, walletAddress);
  const wrongWallet = await wrongAccount.getWallet();
  const tokenWithWrongWallet = token.withWallet(wrongWallet);

  try {
    await tokenWithWrongWallet.methods.mint_private(200, secretHash).simulate();
  } catch (err) {
    logger(`Failed to send tx: ${err}`);
  }
}

main();
