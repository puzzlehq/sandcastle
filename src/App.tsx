import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card.tsx';
import { networkAtom } from './components/network.tsx';
import { Input } from './components/ui/input.tsx';
import { Button } from './components/ui/button.tsx';
import { useAtom } from 'jotai';
import { MultisigCard } from './components/multisig-card.tsx';
import { getAccounts } from './lib/storage.ts';
import { AccountCard } from './components/account-card.tsx';
import { Header } from './components/header.tsx';

function App() {
  const [network] = useAtom(networkAtom);
  const accounts = getAccounts();

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
              <CardContent className="">
                <Input placeholder='These pretzels are making me thirsty'/>
              </CardContent>
              <CardFooter>
                <Button className='ml-auto'>Propose</Button>
              </CardFooter>
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
