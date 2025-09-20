/// <reference types="houdini-svelte">

/** @type {import('houdini').ConfigFile} */
const config = {
  schemaPath: './schema.graphql',
  sourceGlob: 'src/**/*.graphql',
  module: 'esm',
  framework: 'svelte',
  plugins: {
    'houdini-svelte': {}
  },
  scalars: {
    // Add custom scalars if needed
  }
}

export default config