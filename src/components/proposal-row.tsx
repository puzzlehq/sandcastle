import { Button } from "./ui/button.tsx";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card.tsx";
import { Account, Proposal, getAccounts } from "@/lib/storage.ts";
import { HStack } from "./ui/stacks.tsx";
import { CheckIcon, Cross2Icon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

enum Status {
  NeedsDecision,
  Approved,
  Denied
}

const ProposalRow = (props: {
  proposal: Proposal,
  approve: (account: Account, proposal: Proposal) => void,
  deny: (account: Account, proposal: Proposal) => void,
  execute: (proposal: Proposal) => void,
}) => {
  const { proposal, approve, deny, execute } = props;
  const accounts = getAccounts();

  const statuses = accounts.map(account => {
    const signature = proposal.signatures.find(s => s.pubkey === account.pubkey.toString());
    if (!signature) throw new Error(`couldnt get signature for ${account.name}`);
    if (!!signature.signature && !signature.denied) {
      return { account, status: Status.Approved };
    } else if (signature.denied) {
      return { account, status: Status.Denied };
    } else {
      return { account, status: Status.NeedsDecision };
    }
  });

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>
            <p>{ '(Nonce ' + proposal.id + ') Transfer ' + proposal.amount.toString() + ' tokens' }</p>
        </CardTitle>
      </CardHeader>
      <CardContent className="">
        <HStack className='px-3 justify-center'>
          { statuses.map(({ account, status }) => {
            return (
              <Card key={account.name}>
                <CardHeader className='p-4'>
                  <CardTitle>{ account.name }</CardTitle>
                </CardHeader>
                <CardContent className='p-4'>
                  { status === Status.Approved && (
                    <CheckCircledIcon color='green' />
                  )}
                  { status === Status.Denied && (
                    <CrossCircledIcon color='red' />
                  )}
                  { status === Status.NeedsDecision && (
                    <HStack>
                      <Button onClick={() => approve(account, proposal)}><CheckIcon /></Button>
                      <Button variant='secondary' onClick={() => deny(account, proposal)}><Cross2Icon /></Button>
                    </HStack>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </HStack>
      </CardContent>
      <CardFooter className='justify-center'>
        <Button onClick={() => execute(proposal)}>Execute</Button>
      </CardFooter>
    </Card>
  );
};

export { ProposalRow };