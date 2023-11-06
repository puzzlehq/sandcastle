import { Button } from "./ui/button.tsx";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card.tsx";
import { PersonIcon, ReloadIcon } from '@radix-ui/react-icons';
import { useAtom } from 'jotai';
import { networkAtom } from "./network.tsx";
import { MultiSchnorrAccountContract } from "@/multi_schnorr_account_contract.ts";
import { AccountManager, AccountWalletWithPrivateKey } from "@aztec/aztec.js";
import { GrumpkinScalar } from "@aztec/circuits.js";
import debug from 'debug';
import { useEffect, useState } from "react";
import { getAccounts, getEncryptionKey, storeEncryptionKey } from "@/lib/storage.ts";
import { HStack } from "./ui/stacks.tsx";

const logger = debug('sandcastle:account');
logger.enabled = true;

const MultisigCard = () => {
  const accounts = getAccounts();
  const [network] = useAtom(networkAtom);
  const [wallet, setWallet] = useState<AccountWalletWithPrivateKey | undefined>();
  const [noWallet, setNoWallet] = useState(false);

  useEffect(() => {
    (async () => {
      const encryptionKey = getEncryptionKey();
      if (!encryptionKey) {
        setNoWallet(true);
        return;
      }
      if (!network.pxe) return;
      const pubkeys = accounts.map(a => a.pubkey);
      const multisig = new AccountManager(
        network.pxe,
        encryptionKey,
        new MultiSchnorrAccountContract(pubkeys[0], pubkeys[1], pubkeys[2])
      );
      setWallet(await multisig.getWallet());
    })()
  }, [network]);

  const [isCreating, setIsCreating] = useState(false);
  const createMultisig = async () => {
    if (!network.pxe) return;
    if (wallet) return;
    setIsCreating(true);
    logger('creating multisig...');
    const encryptionPrivateKey = GrumpkinScalar.random();
    storeEncryptionKey(encryptionPrivateKey);
    const pubkeys = accounts.map(a => a.pubkey);
    const createdMultisig = new AccountManager(
      network.pxe,
      encryptionPrivateKey,
      new MultiSchnorrAccountContract(pubkeys[0], pubkeys[1], pubkeys[2])
    );
    logger('created multisig', createdMultisig);
    logger('deploying multisig...');
    const w = await createdMultisig.waitDeploy();
    logger('deployed multisig', w);
    setWallet(w);
    setIsCreating(false);
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>
          <HStack className='gap-0 items-center'>
            <PersonIcon className='h-5 w-5'/>
            <PersonIcon className='h-5 w-5'/>
            <PersonIcon className='h-5 w-5'/>
            <div className='w-5' />
            <p>Multisig</p>
          </HStack>
        </CardTitle>
      </CardHeader>
      <CardContent className="">
        {wallet ? (
          <p>{'Deployed at address: ' + wallet.getAddress().toShortString()}</p>
        ) : noWallet ? (
          <Button
            className='m-auto'
            onClick={createMultisig}
            disabled={isCreating}
          >
            {isCreating && <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />}
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        ) : (
          <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
        )}
      </CardContent>
    </Card>
  );
};

export { MultisigCard };