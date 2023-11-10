import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card.tsx';
import { networkAtom } from './components/network.tsx';
import { Input } from './components/ui/input.tsx';
import { Button } from './components/ui/button.tsx';
import { useAtom } from 'jotai';
import { MultisigCard, multisigAtom } from './components/multisig-card.tsx';
import { Account, Proposal, getAccounts, getProposals, storeProposals } from './lib/storage.ts';
import { AccountCard } from './components/account-card.tsx';
import { Header } from './components/header.tsx';
import { useForm } from 'react-hook-form';
import { ProposalRow } from './components/proposal-row.tsx';
import { Schnorr } from '@aztec/circuits.js/barretenberg';
import { Fr } from '@aztec/circuits.js';
import { useEffect, useState } from 'react';
import { AccountWalletWithPrivateKey, computeAuthWitMessageHash, computeMessageSecretHash, getSandboxAccountsWallets } from '@aztec/aztec.js';
import debug from 'debug';
import { TokenContract } from '@aztec/noir-contracts/types';
import { ReloadIcon } from '@radix-ui/react-icons';
import { HStack } from './components/ui/stacks.tsx';

const logger = debug('sandcastle:app');
logger.enabled = true;

type FormData = {
  amount: number;
}

function App() {
  const accounts = getAccounts();
  const [network] = useAtom(networkAtom);
  const [multisig] = useAtom(multisigAtom);
  const [token, setToken] = useState<TokenContract | undefined>();
  const [deployingToken, setDeployingToken] = useState(false);
  const { register, handleSubmit } = useForm<FormData>();

  const [recipients, setRecipients] = useState<AccountWalletWithPrivateKey[] | undefined>();

  useEffect(() => {
    (async () => {
      if (!network.pxe) return;
      const accounts = await getSandboxAccountsWallets(network.pxe);
      setRecipients(accounts);
    })()
  }, [network]);

  const [proposals, setProposals] = useState<Proposal[]>(getProposals());
  useEffect(() => {
    if (proposals.length > 0) {
      storeProposals(proposals);
    }
  }, [proposals]);

  useEffect(() => {
    (async () => {
      if (multisig) {
        const address = multisig.getAddress();
        logger('deploying token contract...');
        setDeployingToken(true);
        const token = await TokenContract.deploy(multisig, { address }).send().deployed();
        setToken(token);
        setDeployingToken(false);
        logger(`deployed token contract at ${token.address}`);

        const secret = Fr.random();
        const secretHash = await computeMessageSecretHash(secret);

        const mintAmount = 5000n;
        logger('minting initial amount...', mintAmount);
        const receipt = await token.methods.mint_private(mintAmount, secretHash).send().wait();
        logger('minted', receipt);

        await token.methods.redeem_shield({ address }, mintAmount, secret).send().wait();

        const balance = await token.methods.balance_of_private({ address }).view();
        logger(`balance of multisig is now ${balance}`);
      }
    })();
  }, [multisig]);

  const addNewProposal = async (d: FormData) => {
    const proposals = getProposals();
    const nonce = proposals.length;
    const amount = new Fr(d.amount);

    if (!recipients) throw new Error('recipients not yet deployed');
    if (!token) throw new Error('token contract not yet deployed');
    if (!multisig) throw new Error('multisig contract not yet deployed');

    let action = token?.withWallet(multisig).methods.transfer(recipients[0].getAddress(), multisig.getAddress(), amount, nonce);
    const message = await computeAuthWitMessageHash(multisig.getAddress(), action.request());

    proposals.push({
      id: proposals.length,
      amount: d.amount,
      message: Fr.fromBuffer(message),
      signatures: accounts.map(account => {
        return {
          pubkey: account.pubkey.toString(),
          denied: false
        };
      }
    ) });
    setProposals(proposals);
  }

  const approve = async (account: Account, proposal: Proposal) => {
    const proposals = getProposals();
    const proposalIndex = proposals.findIndex(p => p.id === proposal.id);
    if (proposalIndex === -1) throw new Error('could not find proposal to approve');

    /// sign the proposal
    const signer = await Schnorr.new();
    const sign = signer.constructSignature(proposal.message.toBuffer(), account.privkey);
    proposals[proposalIndex].signatures = proposals[proposalIndex].signatures.map(signature => {
      if (signature.pubkey === account.pubkey.toString()) {
        return {
          ...signature,
          signature: sign
        };
      }
      return signature;
    });

    setProposals(proposals);
  }

  const deny = async (account: Account, proposal: Proposal) => {
    const proposals = getProposals();
    const proposalIndex = proposals.findIndex(p => p.id === proposal.id);
    if (proposalIndex === -1) throw new Error('could not find proposal to deny');

    proposals[proposalIndex].signatures = proposals[proposalIndex].signatures.map(signature => {
      if (signature.pubkey === account.pubkey.toString()) {
        return {
          ...signature,
          denied: true
        };
      }
      return signature;
    });
  
    setProposals(proposals);
  }

  const execute = async (proposal: Proposal) => {
    if (!network || !multisig || !token || !recipients) return;
    console.log('executing proposal', proposal);
    const authWit = await multisig.createAuthWitness(proposal.message);
    await multisig.addAuthWitness(authWit);
    logger('transferring tokens...');
    await token.methods.transfer(recipients[0].getAddress(), multisig.getAddress(), proposal.amount, proposal.id).send().wait();
    logger('transferred tokens!');
  }

  return (
    <div className="hidden flex-col md:flex">
      <Header />
      {network.pxe ? (
        <div className='w-50 flex-1 space-y-4 p-36 pt-6'>
          <div className='grid gap-4 grid-cols-3'>
            {accounts.map(account => (
              <AccountCard key={account.name} account={account} />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <MultisigCard />
            <Card>
              <CardHeader>
                <CardTitle>Propose Transfer</CardTitle>
              </CardHeader>
              { token ? (
                <form onSubmit={handleSubmit(addNewProposal)}>
                  <CardContent className="">
                    <Input {...register('amount')} placeholder='10'/>
                  </CardContent>
                  <CardFooter>
                    <Button type='submit' className='ml-auto'>Propose</Button>
                  </CardFooter>
                </form>
              ) : (
                  deployingToken ? (
                    <CardContent>
                      <HStack className='items-center'>
                        <p>Deploying token contract...</p>
                        <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
                      </HStack>
                    </CardContent>
                  ) : (
                    <CardContent>
                      <HStack className='items-center'>
                        <p>Waiting on multisig...</p>
                        <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
                      </HStack>
                    </CardContent>
                  )
              ) }
            </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Proposals</CardTitle>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                  {proposals.map(proposal => (
                    <ProposalRow key={proposal.id} proposal={proposal} approve={approve} deny={deny} execute={execute} />
                  ))}
                </CardContent>
              </Card>
          </div>
        </div>
      ) : (
        <div>Connecting...</div>
      )}
    </div>
  )
};

export default App;
