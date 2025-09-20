/// <references types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */

const config = {
  watchSchema: {
    url: 'env:VITE_PUBLIC_GRAPHQL_ENDPOINT',
    interval: null
  },
  plugins: {
    'houdini-svelte': {}
  },
  componentFields: true,
  defaultCachePolicy: 'NetworkOnly',
  defaultFragmentMasking: 'disable'
};

export default config;