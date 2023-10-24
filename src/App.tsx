import {
  AccountManager,
  NodeInfo,
  PXE,
  createPXEClient,
  waitForSandbox,
} from '@aztec/aztec.js';
import { GrumpkinScalar } from '@aztec/circuits.js';
import { MultiSchnorrAccountContract } from './multi_schnorr_account_contract.js';
import debug from 'debug';
import { useEffect, useState } from 'react';

const logger = debug('sandcastle');
logger.enabled = true;
const { VITE_SANDBOX_URL } = import.meta.env;
const PRIVATE_KEY_1 = new GrumpkinScalar(0xd35d743ac0dfe3d6dbe6be8c877cb524a00ab1e3d52d7bada095dfc8894ccfan);
const PRIVATE_KEY_2 = new GrumpkinScalar(0xd35d743ac0dfe3d6dbe6be8c877cb524b00ab1e3d52d7bada095dfc8894ccfan);

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
      const account = new AccountManager(pxe, encryptionPrivateKey, new MultiSchnorrAccountContract(PRIVATE_KEY_1, PRIVATE_KEY_2));
      logger('account', account);
      logger('deploying account...');
      const wallet = await account.waitDeploy();
      logger('deployed account', wallet);
      const address = wallet.getCompleteAddress().address;
      logger('address', address);
    })()
  }, []);

  return (
    <>
      {pxe ? (
        <p className="text-3xl font-bold underline">Sandbox running ({nodeInfo?.chainId})</p>
      ) : (
        <p>Loading PXE...</p>
      )}
    </>
  )
}

export default App
