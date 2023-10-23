import { defineConfig } from 'vite';
// import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import {NodeGlobalsPolyfillPlugin} from "@esbuild-plugins/node-globals-polyfill";


// import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import path, { dirname } from 'path';
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const wasmPath = `${dirname(require.resolve(`@aztec/circuits.js`)).replace(
    /\/dest$/,
    '',
  )}/resources/aztec3-circuits.wasm`;

export default defineConfig({
  resolve: {
    alias: {
      $src: path.resolve('src')
      // Buffer: 'buffer/'
      // buffer: require.resolve('buffer/')
    }
  },
	plugins: [
    react(),
    viteStaticCopy({
      targets: [{
        src: wasmPath,
        dest: './'
      }]
    }),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['path'],
      // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Override the default polyfills for specific modules.
      // overrides: {
      //   // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
      //   fs: 'memfs',
      //   buffer: 'buffer'
      // },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),

  ],
  // optimizeDeps: {
  //   esbuildOptions: {
  //     define: {
  //       global: "globalThis",
  //     },
  //     plugins: [
  //       // NodeGlobalsPolyfillPlugin({
  //       //   buffer: true,
  //       // }),
  //     ]

  //   },
  // },
  // build: {
  //   rollupOptions: {
  //     external: ['fs/promises']
  //   }
  // }
});
