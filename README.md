# sandcastle

## contents

* `src/contracts` contains the `single_schnorr` example contract as well as the `multi_schnorr` 3-3 multisig contract
* `src` contains the node testing script and eventually the multisig frontend

## development

* make sure you're on the correct noir version for aztec-nr development - `noirup -v 0.17.0-aztec.2`
* if you make changes to the contract, compile it with `aztec-cli compile contracts/multi_schnorr`

## running & building

```bash
pnpm i
pnpm dev
pnpm build
pnpm preview
```
