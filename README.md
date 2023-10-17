# sandcastle

## contents

`contracts` contains the `single_schnorr` example contract as well as the `multi_schnorr` 2-2 multisig contract
`src` contains the node testing script and eventually the multisig frontend

## development

* make sure you're on the correct noir version for aztec-nr development - `noirup -v 0.16.0-aztec.1`
* if you make changes to the contract, compile it with `aztec-cli compile contracts/multi_schnorr`

