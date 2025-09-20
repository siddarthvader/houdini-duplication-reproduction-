import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from 'node:fs'

// Read the GraphQL schema
const typeDefs = fs.readFileSync('./schema.graphql', 'utf-8')

// Mock data for testing the duplication bug
const mockOrder = {
  id: "order_123",
  hash: "abc123def456",
  status: "CONFIRMED",
  orderItems: [
    {
      id: "item_1",
      name: "Test Item",
      description: "A test item for reproduction",
      price: 1500, // in cents
      quantity: 2,
      optionSets: [
        {
          id: "optionset_1",
          name: "Size",
          selectedOption: {
            id: "option_1", // This field causes the duplication issue
            name: "Large",
            price: 200,
            posReferenceId: "pos_ref_1",
            posSource: "square"
          }
        },
        {
          id: "optionset_2",
          name: "Extras",
          selectedOption: {
            id: "option_2", // This field causes the duplication issue
            name: "Extra Cheese",
            price: 100,
            posReferenceId: "pos_ref_2",
            posSource: "square"
          }
        }
      ]
    }
  ]
}

// Resolvers
const resolvers = {
  Query: {
    orderByHash: (parent, args, context, info) => {
      console.log('Querying order by hash:', args.req.orderHash)
      return {
        order: mockOrder
      }
    }
  }
}

// Create GraphQL server
const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  cors: {
    origin: ['*'],
    credentials: true,
    methods: ['*'],
  },
  graphiql: {
    defaultQuery: `
query GetOrder {
  orderByHash(req: { orderHash: "abc123def456" }) {
    order {
      id
      hash
      status
      orderItems {
        id
        name
        description
        price
        quantity
        optionSets {
          id
          name
          selectedOption {
            id
            name
            price
            posReferenceId
            posSource
          }
        }
      }
    }
  }
}
    `,
  },
})

// Create and start server
const server = createServer(yoga)

server.listen(4000, () => {
  console.log('🚀 GraphQL API server running at http://localhost:4000/graphql')
  console.log('🔍 GraphiQL interface available at http://localhost:4000/graphql')
})