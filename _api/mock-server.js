import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from 'node:fs'

// Read the GraphQL schema
const typeDefs = fs.readFileSync('./schema.graphql', 'utf-8')

// Mock data for testing the duplication bug
// KEY: Multiple order items with SAME optionSet ID but different selectedOptions
const mockOrder = {
  id: "order_123",
  hash: "abc123def456",
  status: "CONFIRMED",
  orderItems: [
    {
      id: "item_1",
      name: "Full English #1",
      description: "Full English",
      price: 10900,
      quantity: 1,
      optionSets: [
        {
          id: "4200d056-0a65-42a5-ad93-a0d11bb975ad", // SAME optionSet ID as item_2
          name: "Egg Temperature",
          selectedOption: {
            id: "3d26a139-936c-4d8f-8439-d4476c2d245f", // Different option ID
            name: "Egg Fried Over Easy Soft",
            price: 0,
            posReferenceId: "109002011",
            posSource: "Micros"
          }
        }
      ]
    },
    {
      id: "item_2",
      name: "Full English #2",
      description: "Full English",
      price: 10900,
      quantity: 1,
      optionSets: [
        {
          id: "4200d056-0a65-42a5-ad93-a0d11bb975ad", // SAME optionSet ID as item_1 - causes collision
          name: "Egg Temperature",
          selectedOption: {
            id: "3a7113c6-4e79-4c67-a56b-59ecf8b80991", // Different option ID
            name: "Egg Fried Sunny Side Up",
            price: 0,
            posReferenceId: "109002001",
            posSource: "Micros"
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