import { HoudiniClient } from "$houdini";
export default new HoudiniClient({
  url: import.meta.env.VITE_PUBLIC_GRAPHQL_ENDPOINT,

  // uncomment this to configure the network call (for things like authentication)
  // for more information, please visit here: https://www.houdinigraphql.com/guides/authentication
  fetchParams({ session, metadata }) {
    return {
      headers: {
        ...(session?.authToken ? { "auth-token": session?.authToken } : {}),
        ...(metadata || {}),
      },
    };
  },
});

