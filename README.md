# sandcastle

## contents

* `src/contracts` contains the `single_schnorr` example contract as well as the `multi_schnorr` 2-2 multisig contract
* `src` contains the node testing script and eventually the multisig frontend

## development

* make sure you're on the correct noir version for aztec-nr development - `noirup -v 0.16.0-aztec.1`
* if you make changes to the contract, compile it with `aztec-cli compile contracts/multi_schnorr`

## svelte

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
