import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card.tsx';
import { networkAtom } from './components/network.tsx';
import { Input } from './components/ui/input.tsx';
import { Button } from './components/ui/button.tsx';
import { useAtom } from 'jotai';
import { MultisigCard } from './components/multisig-card.tsx';
import { Account, Proposal, getAccounts, getProposals, storeProposals } from './lib/storage.ts';
import { AccountCard } from './components/account-card.tsx';
import { Header } from './components/header.tsx';
import { useForm } from 'react-hook-form';
import { ProposalRow } from './components/proposal-row.tsx';
import { Schnorr, SchnorrSignature } from '@aztec/circuits.js/barretenberg';
import { Fr } from '@aztec/circuits.js';
import { useEffect, useState } from 'react';

type FormData = {
  message: string;
}

function App() {
  const [network] = useAtom(networkAtom);
  const accounts = getAccounts();
  const { register, handleSubmit } = useForm<FormData>();

  const [proposals, setProposals] = useState<Proposal[]>(getProposals());
  useEffect(() => {
    if (proposals.length > 0) {
      storeProposals(proposals);
    }
  }, [proposals]);

  const teknos = async () => {

  };

  const addNewProposal = async (d: FormData) => {
    const message = d.message;
    const proposals = getProposals();
    proposals.push({
      id: proposals.length,
      message: Fr.fromString(message),
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
                <CardTitle>Propose Message</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit(addNewProposal)}>
                <CardContent className="">
                  <Input {...register("message")} placeholder='These pretzels are making me thirsty'/>
                </CardContent>
                <CardFooter>
                  <Button type='submit' className='ml-auto'>Propose</Button>
                </CardFooter>
              </form>
            </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                  {proposals.map(proposal => (
                    <ProposalRow proposal={proposal} approve={approve} deny={deny} />
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
