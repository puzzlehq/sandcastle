// "use client"

// import * as React from "react"
// import {
//   CaretSortIcon,
//   CheckIcon,
//   PlusCircledIcon,
// } from "@radix-ui/react-icons"

// import { cn } from "@/lib/utils.js"
// import { Button } from "@/components/ui/button.js"
// import {
//   Command,
//   CommandGroup,
//   CommandItem,
//   CommandList,
//   CommandSeparator,
// } from "@/components/ui/command.js"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog.js"
// import { Input } from "@/components/ui/input.js"
// import { Label } from "@/components/ui/label.js"
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover.js"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select.js"
// import { GrumpkinScalar } from "@aztec/aztec.js"
// import { atom } from "jotai"

// import Avatar from "boring-avatars";
// import { Account, addAccount, getAccounts, getSelectedAccount, storeSelectedAccount } from "@/lib/storage.ts"

// const AvatarComponent = (props: {value: string}) => {
//   return (
//     <div className="mr-2">
//       <Avatar
//         size={20}
//         name={props.value}
//         variant="marble"
//         colors={["#ffd9cc", "#a3f5d6", "#000000", "#bb86fc"]}
//       />
//     </div>
//   );
// }

// type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

// interface AccountPickerProps extends PopoverTriggerProps {}

// export const selectedAccount = atom<Account>(getAccounts()[0]);

// export default function AccountPicker({ className }: AccountPickerProps) {
//   const [accounts, setAccounts] = React.useState<Account[]>(getAccounts());
//   const [open, setOpen] = React.useState(false);
//   const [showNewAccountDialog, setShowNewAccountDialog] = React.useState(false);
//   const [selectedAccount, setSelectedAccount] = React.useState<Account>(accounts[0]);

//   React.useEffect(() => {
//     const stored = getSelectedAccount();
//     setSelectedAccount(stored ? accounts.find(a => a.name === stored) ?? accounts[0] : accounts[0]);
//   }, []);

//   const nameInputRef = React.useRef<HTMLInputElement>(null);
//   const createAccount = () => {
//     const name = nameInputRef.current?.value;
//     if (!name) return;
//     const newAccount = addAccount(name);
//     setAccounts([ ...accounts, newAccount ]);
//     setSelectedAccount(newAccount);
//     setShowNewAccountDialog(false);
//   }

//   React.useEffect(() => {
//     storeSelectedAccount(selectedAccount);
//   }, [selectedAccount]);

//   return (
//     <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             variant="outline"
//             role="combobox"
//             aria-expanded={open}
//             aria-label="Select an account"
//             className={cn("w-[200px] justify-between", className)}
//           >
//             <AvatarComponent value={selectedAccount.key.toString()} />
//             {selectedAccount.name}
//             <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-[200px] p-0">
//           <Command>
//             <CommandList>
//               <CommandGroup heading={"Accounts"}>
//                 {accounts.map((account) => (
//                   <CommandItem
//                     key={account.key.toString()}
//                     onSelect={() => {
//                       setSelectedAccount(account)
//                       setOpen(false)
//                     }}
//                     className="text-sm"
//                   >
//                     <AvatarComponent value={account.key.toString()} />
//                     {account.name}
//                     <CheckIcon
//                       className={cn(
//                         "ml-auto h-4 w-4",
//                         selectedAccount.name === account.name
//                           ? "opacity-100"
//                           : "opacity-0"
//                       )}
//                     />
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             </CommandList>
//             <CommandSeparator />
//             <CommandList>
//               <CommandGroup>
//                 <DialogTrigger asChild>
//                   <CommandItem
//                     onSelect={() => {
//                       setOpen(false)
//                       setShowNewAccountDialog(true)
//                     }}
//                   >
//                     <PlusCircledIcon className="mr-2 h-5 w-5" />
//                     Create Account
//                   </CommandItem>
//                 </DialogTrigger>
//               </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Create account</DialogTitle>
//           <DialogDescription>
//             Add a new account to sign messages.
//           </DialogDescription>
//         </DialogHeader>
//         <div>
//           <div className="space-y-4 py-2 pb-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Account name</Label>
//               <Input id="name" placeholder="Charles" ref={nameInputRef} />
//             </div>
//           </div>
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => setShowNewAccountDialog(false)}>
//             Cancel
//           </Button>
//           <Button type="submit" onClick={createAccount}>Create</Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }