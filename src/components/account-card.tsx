import { Account } from "@/lib/storage.ts";
import { Card } from "./ui/card.tsx";
import { PersonIcon } from '@radix-ui/react-icons';
import { HStack } from "./ui/stacks.tsx";

const AccountCard = (props: { account: Account }) => {
  const { account } = props;
  return (
    <Card className='p-4 flex flex-col gap-4'>
      <HStack className='items-center'>
        <PersonIcon className='h-5 w-5'/>
        <p>{account.name}</p>
      </HStack>
      <small>{account.pubkey.toShortString()}</small>
    </Card>
  );
}

export { AccountCard };