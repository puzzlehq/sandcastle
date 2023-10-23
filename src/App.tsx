import './App.css'
import {
  AccountManager,
  Fr,
  NodeInfo,
  PXE,
  SingleKeyAccountContract,
  computeMessageSecretHash,
  createPXEClient,
  waitForSandbox,
} from '@aztec/aztec.js';
import { GrumpkinScalar } from '@aztec/circuits.js';
import { TokenContract } from '@aztec/noir-contracts/types';
import { MultiSchnorrAccountContract } from './multi_schnorr_account_contract';
import debug from 'debug';
import { useEffect, useState } from 'react';
const logger = debug('sandcastle');
const { VITE_SANDBOX_URL } = import.meta.env;
const PRIVATE_KEY_1 = GrumpkinScalar.fromString('0xd35d743ac0dfe3d6dbe6be8c877cb524a00ab1e3d52d7bada095dfc8894ccfa');
// const PRIVATE_KEY_2 = GrumpkinScalar.fromString('0xd35d743ac0dfe3d6dbe6be8c877cb524b00ab1e3d52d7bada095dfc8894ccfa');

function App() {
  const [pxe, setPXE] = useState<PXE | undefined>();
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | undefined>()

  useEffect(() => {
    (async () => {
      logger('creating pxe client...');
      const pxe = createPXEClient(VITE_SANDBOX_URL);
      logger('waiting for sandbox...');
      await waitForSandbox(pxe);
      setPXE(pxe);
      logger('getting node info...');
      const nodeInfo = await pxe.getNodeInfo();
      setNodeInfo(nodeInfo);

      const encryptionPrivateKey = GrumpkinScalar.random();
      const account = new AccountManager(pxe, encryptionPrivateKey, new SingleKeyAccountContract(PRIVATE_KEY_1));
      console.log(account)
      // const wallet = await account.waitDeploy();
      // const address = wallet.getCompleteAddress().address;

      // /// initialize token contract and mint some tokens
      // const token = await TokenContract.deploy(wallet, { address }).send().deployed();
      // logger(`Deployed token contract at ${token.address}`);
      // await token.methods._initialize({ address }).send().wait();

      // const secret = Fr.random();
      // const secretHash = await computeMessageSecretHash(secret);

      // await token.methods.mint_private(50, secretHash).send().wait();
      // await token.methods.redeem_shield({ address }, 50, secret).send().wait();

      // const balance = await token.methods.balance_of_private({ address }).view();
      // logger(`Balance of wallet is now ${balance}`);

      // /// try with wrong keys
      // const walletAddress = wallet.getCompleteAddress();
      // const wrongKey1 = GrumpkinScalar.random();
      // const wrongKey2 = GrumpkinScalar.random();
      // const wrongAccountContract = new MultiSchnorrAccountContract(wrongKey1, wrongKey2);
      // const wrongAccount = new AccountManager(pxe, encryptionPrivateKey, wrongAccountContract, walletAddress);
      // const wrongWallet = await wrongAccount.getWallet();
      // const tokenWithWrongWallet = token.withWallet(wrongWallet);

      // try {
      //   await tokenWithWrongWallet.methods.mint_private(200, secretHash).simulate();
      // } catch (err) {
      //   logger(`Failed to send tx: ${err}`);
      // }
    })()
  }, []);

  return (
    <>
      {pxe ? (
        <p>Sandbox running ({nodeInfo?.chainId})</p>
      ) : (
        <p>Loading PXE...</p>
      )}
    </>
  )
}

export default App
