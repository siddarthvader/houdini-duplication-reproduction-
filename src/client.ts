import { createClient } from 'houdini';

export default createClient({
  url: 'http://localhost:3000/graphql',
  fetchParams: {
    credentials: 'include'
  }
});