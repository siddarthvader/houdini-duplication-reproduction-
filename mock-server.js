#!/usr/bin/env node

/**
 * Mock GraphQL Server for Houdini Duplication Bug Reproduction
 *
 * This server provides the GraphQL endpoint that returns data
 * triggering the selectedOption duplication bug.
 */

import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import cors from 'cors';

// GraphQL Schema
const schema = buildSchema(`
  input ReqOrderByHash {
    orderHash: String!
  }

  type Query {
    orderByHash(req: ReqOrderByHash!): OrderByHashResponse
  }

  type OrderByHashResponse {
    order: Order
  }

  type Order {
    id: ID!
    hash: String!
    status: String!
    orderItems: [OrderItem!]!
    __typename: String!
  }

  type OrderItem {
    id: ID!
    name: String!
    description: String
    price: Int!
    quantity: Int!
    optionSets: [CartItemOptionSet!]!
    __typename: String!
  }

  type CartItemOptionSet {
    id: ID!
    name: String!
    selectedOption: CartItemOption
    __typename: String!
  }

  type CartItemOption {
    id: ID!
    name: String!
    price: Int!
    posReferenceId: String
    posSource: String
    __typename: String!
  }

  enum OrderStatus {
    OPEN
    CONFIRMED
    PREPARING
    READY
    DELIVERED
    CANCELLED
  }
`);

// Mock data that triggers the duplication bug
const mockData = {
  orderByHash: {
    order: {
      id: "order_123",
      hash: "test_hash_456",
      status: "OPEN",
      orderItems: [
        {
          id: "item_1",
          name: "Burger",
          description: "Delicious burger with options",
          price: 1200,
          quantity: 1,
          optionSets: [
            {
              id: "optionset_1",
              name: "Size",
              selectedOption: {
                id: "option_large",
                name: "Large",
                price: 200,
                posReferenceId: "POS_LARGE_001",
                posSource: "MICROS"
              }
            },
            {
              id: "optionset_2",
              name: "Add-ons",
              selectedOption: {
                id: "option_cheese",
                name: "Extra Cheese",
                price: 100,
                posReferenceId: "POS_CHEESE_001",
                posSource: "MICROS"
              }
            }
          ]
        },
        {
          id: "item_2",
          name: "Pizza",
          description: "Tasty pizza with options",
          price: 1800,
          quantity: 1,
          optionSets: [
            {
              id: "optionset_3",
              name: "Size",
              selectedOption: {
                // This is the duplication bug - same option ID in different context
                id: "option_large", // Same ID as above!
                name: "Large",
                price: 200,
                posReferenceId: "POS_LARGE_001",
                posSource: "MICROS"
              }
            },
            {
              id: "optionset_4",
              name: "Toppings",
              selectedOption: {
                id: "option_pepperoni",
                name: "Pepperoni",
                price: 150,
                posReferenceId: "POS_PEPPERONI_001",
                posSource: "MICROS"
              }
            }
          ]
        }
      ]
    }
  }
};

// Root resolver
const root = {
  orderByHash: ({ req }) => {
    console.log('📡 Mock GraphQL Server: orderByHash called with:', req);

    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📡 Mock GraphQL Server: Returning mock data');
        resolve(mockData.orderByHash);
      }, 500);
    });
  }
};

// Create Express server
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Enable GraphiQL for testing
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock GraphQL Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Mock GraphQL Server started!');
  console.log(`📡 GraphQL Endpoint: http://localhost:${PORT}/graphql`);
  console.log(`🔗 GraphiQL: http://localhost:${PORT}/graphql`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('🐛 This server provides data that triggers the Houdini selectedOption duplication bug');
  console.log('   - Same option ID ("option_large") appears in different orderItems');
  console.log('   - This causes cache collision in nested GraphQL fragments');
  console.log('');
  console.log('📋 To test the bug:');
  console.log('   1. Start the SvelteKit app: npm run dev');
  console.log('   2. Open http://localhost:5173');
  console.log('   3. Click "Fetch Order Data"');
  console.log('   4. Check for duplication warnings');
});