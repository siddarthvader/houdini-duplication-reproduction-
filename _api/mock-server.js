import { createYoga, createSchema } from "graphql-yoga";
import { createServer } from "node:http";
import fs from "node:fs";

// Read the GraphQL schema
const typeDefs = fs.readFileSync("./schema.graphql", "utf-8");

// Mock data for testing the duplication bug
// KEY: Multiple order items with SAME optionSet ID but different selectedOptions
const mockOrder = {
  createdAt: "2025-09-05T06:44:45.857458Z",
  hash: "B6BF97C8",
  id: "4fbe5b43-42b2-4da1-965d-05d03492e060",
  isTipsEligible: false,
  orderItems: [
    {
      description: "Full English",
      extras: [],
      id: "6b7bc36a-d2aa-446a-ad31-27e45303e5c6",
      isSyncedWithPos: false,
      menuItemId: "8bf92150-265c-47e0-ba5e-525c6c56e8b3",
      name: "Full English",
      note: "",
      optionSets: [
        {
          id: "4200d056-0a65-42a5-ad93-a0d11bb975ad", // SAME optionSet ID as item_2
          name: "Egg Temperature",
          selectedOption: {
            id: "3d26a139-936c-4d8f-8439-d4476c2d245f",
            name: "Egg Fried Over Easy Soft",
            posReferenceId: "109002011",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
        {
          id: "63df7019-3d13-4d39-aaa7-7753a1eaee39",
          name: "Food No",
          selectedOption: {
            id: "7053e231-d5f3-41ec-9245-300c68013067",
            name: "No Nuts",
            posReferenceId: "109252003",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
        {
          id: "7e6ab11c-bb89-4700-8ee6-e20373611c89",
          name: "Food Extra",
          selectedOption: {
            id: "08805230-9ee7-435e-a6f9-cb1c5d237720",
            name: "Extra Bacon",
            posReferenceId: "109251003",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
        {
          id: "9f5d4af6-5b76-4f8f-93df-66556ee00202",
          name: "Food Intruction",
          selectedOption: {
            id: "79bfaeab-bd71-4628-8b42-607f495b9b53",
            name: "Dressing on the Side",
            posReferenceId: "109253003",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
      ],
      linkedContent: null,
      orderItemStatus: "Placed",
      orderedBy: {
        countryCode: "+27",
        email: "hamzaanis9514@gmail.com",
        firstName: "Hamza",
        id: "2b879bad-1c16-499d-8fc5-4adba4793bd3",
        lastName: "Anis",
        phone: "3420011719",
        profilePicturePath:
          "nsuna-stage/7764fc5a-2a45-4e23-beb3-2bd0e5eecf24/upload-e8cdb3a1-20f4-4900-a56c-c03add29be6d893519272040902172156EF5AC6-EE89-49C6-84A3-857DFFD4E104.jpg",
        status: "Active",
        __typename: "Customer",
      },
      originalPrice: null,
      paymentStatus: "Unpaid",
      posReferenceId: "101101004",
      posSource: "Micros",
      price: 10900,
      quantity: 1,
      __typename: "OrderItem",
    },
    {
      description: "Full English",
      extras: [],
      id: "6d23cc84-a0c8-4c8c-86f8-4b61b452177c",
      isSyncedWithPos: false,
      menuItemId: "8bf92150-265c-47e0-ba5e-525c6c56e8b3",
      name: "Full English",
      note: "",
      optionSets: [
        {
          id: "4200d056-0a65-42a5-ad93-a0d11bb975ad", // SAME optionSet ID as item_1 - causes collision
          name: "Egg Temperature",
          selectedOption: {
            id: "3a7113c6-4e79-4c67-a56b-59ecf8b80991",
            name: "Egg Fried Sunny Side Up",
            posReferenceId: "109002001",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
        {
          id: "63df7019-3d13-4d39-aaa7-7753a1eaee39",
          name: "Food No",
          selectedOption: {
            id: "15d5f145-f5d0-4594-9f38-e35f4aaf0d5b",
            name: "No Dairy",
            posReferenceId: "109252002",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
        {
          id: "7e6ab11c-bb89-4700-8ee6-e20373611c89",
          name: "Food Extra",
          selectedOption: {
            id: "f9ac5453-1d73-44f9-a160-a08f707977e1",
            name: "Extra Avocado",
            posReferenceId: "109251002",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
        {
          id: "9f5d4af6-5b76-4f8f-93df-66556ee00202",
          name: "Food Intruction",
          selectedOption: {
            id: "5ff5f39a-6784-4fff-af54-3166e08a1bb3",
            name: "Sauce on the Side",
            posReferenceId: "109253002",
            posSource: "Micros",
            price: 0,
            __typename: "CartItemOption",
          },
          __typename: "CartItemOptionSet",
        },
      ],
      linkedContent: null,
      orderItemStatus: "Placed",
      orderedBy: {
        countryCode: "+27",
        email: "hamzaanis9514@gmail.com",
        firstName: "Hamza",
        id: "2b879bad-1c16-499d-8fc5-4adba4793bd3",
        lastName: "Anis",
        phone: "3420011719",
        profilePicturePath:
          "nsuna-stage/7764fc5a-2a45-4e23-beb3-2bd0e5eecf24/upload-e8cdb3a1-20f4-4900-a56c-c03add29be6d893519272040902172156EF5AC6-EE89-49C6-84A3-857DFFD4E104.jpg",
        status: "Active",
        __typename: "Customer",
      },
      originalPrice: null,
      paymentStatus: "Unpaid",
      posReferenceId: "101101004",
      posSource: "Micros",
      price: 10900,
      quantity: 1,
      __typename: "OrderItem",
    },
    {
      description: "CBC Amber Weiss 500ml Draught",
      extras: [],
      id: "31e6634b-34bd-414d-a103-c8b515c18ffc",
      isSyncedWithPos: true,
      menuItemId: "04548cbf-94d0-447e-a614-8cec654fec57",
      name: "CBC Amber Weiss 500ml Draught",
      note: null,
      optionSets: [],
      linkedContent: null,
      orderItemStatus: "Placed",
      orderedBy: {
        countryCode: "",
        email: null,
        firstName: "test",
        id: "bf36c37f-50fa-4f3e-87b3-16af3148cf0c",
        lastName: "test092",
        phone: "12309563",
        profilePicturePath: null,
        status: "Created",
        __typename: "Customer",
      },
      originalPrice: null,
      paymentStatus: "Unpaid",
      posReferenceId: "103201505",
      posSource: "Micros",
      price: 5900,
      quantity: 1,
      __typename: "OrderItem",
    },
  ],
  orderTable: {
    id: "9c6a25f2-7bd9-4757-9177-439d0e996caa",
    no: "101/1",
    numberOfSeats: 0,
    isActive: false,
    assignedStaffs: [
      {
        createdAt: "2025-09-04T14:14:45.638605Z",
        email: null,
        firstName: "test",
        id: "7c445fea-da60-49ff-8f26-8b5d3f013031",
        isOvertimeExempt: false,
        isTipsEligible: false,
        lastName: "test092",
        phoneNumber: "12309563",
        profilePicturePath: null,
        role: "ServingStaff",
        status: "Created",
        wageRate: null,
        wageType: null,
        __typename: "AssignedStaff",
      },
    ],
    qrCodeUrl:
      "https://stage-cdn.nsuna.io/m/ed52c896-e867-42b6-ae6b-5e83ae26e904/p/e9c4121d-d5a8-4198-9364-12dbbc99a46e/qr/qr-table101/1-9c6a25f2-7bd9-4757-9177-439d0e996caa.png",
    posReferenceId: "101/1",
    posSource: "Micros",
    activeStaff: {
      createdAt: "2025-09-04T14:14:45.638605Z",
      email: null,
      firstName: "test",
      id: "7c445fea-da60-49ff-8f26-8b5d3f013031",
      isOvertimeExempt: false,
      isTipsEligible: false,
      lastName: "test092",
      phoneNumber: "12309563",
      profilePicturePath: null,
      role: "ServingStaff",
      status: "Created",
      wageRate: null,
      wageType: null,
      __typename: "AssignedStaff",
    },
    currentPaid: null,
    currentTotal: null,
    seatedGuests: [
      {
        countryCode: "+27",
        email: "hamzaanis9514@gmail.com",
        firstName: "Hamza",
        id: "2b879bad-1c16-499d-8fc5-4adba4793bd3",
        lastName: "Anis",
        phone: "3420011719",
        profilePicturePath:
          "nsuna-stage/7764fc5a-2a45-4e23-beb3-2bd0e5eecf24/upload-e8cdb3a1-20f4-4900-a56c-c03add29be6d893519272040902172156EF5AC6-EE89-49C6-84A3-857DFFD4E104.jpg",
        status: "Active",
        __typename: "Customer",
      },
    ],
    status: "Occupied",
    __typename: "Table",
  },
  outstandingAmounts: [
    {
      outstanding: 21800,
      totalDue: 21800,
      totalPaid: 0,
      userId: "2b879bad-1c16-499d-8fc5-4adba4793bd3",
    },
    {
      outstanding: 5900,
      totalDue: 5900,
      totalPaid: 0,
      userId: "bf36c37f-50fa-4f3e-87b3-16af3148cf0c",
    },
  ],
  paidTotal: 0,
  payableTotal: 27700,
  paymentStatus: "Unpaid",
  payments: [],
  servingStaff: {
    id: "bf36c37f-50fa-4f3e-87b3-16af3148cf0c",
    firstName: "test",
    lastName: "test092",
    profilePicturePath: null,
    passcode: "9999",
    status: "Created",
    role: "ServingStaff",
    email: null,
    phoneNumber: "12309563",
    isTipsEligible: false,
    isOvertimeExempt: false,
    countryCode: "",
    wageType: "Hourly",
    wageRate: 0,
    assignedTables: [],
    createdAt: "2025-09-04T14:14:45.638605Z",
    __typename: "Staff",
  },
  status: "Open",
  tipsPaidTotal: 0,
  __typename: "Order",
};

// Resolvers
const resolvers = {
  Query: {
    orderByHash: (parent, args, context, info) => {
      console.log("Querying order by hash:", args.req.orderHash);
      return {
        order: mockOrder,
      };
    },
  },
};

// Create GraphQL server
const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  cors: {
    origin: ["*"],
    credentials: true,
    methods: ["*"],
  },
  graphiql: {
    defaultQuery: `
query GetOrder {
  orderByHash(req: { orderHash: "B6BF97C8" }) {
    order {
      id
      hash
      createdAt
      status
      isTipsEligible
      orderItems {
        id
        name
        description
        price
        quantity
        menuItemId
        isSyncedWithPos
        orderItemStatus
        paymentStatus
        posReferenceId
        posSource
        optionSets {
          id
          name
          selectedOption {
            id
            name
            price
            posReferenceId
            posSource
            __typename
          }
          __typename
        }
        orderedBy {
          id
          firstName
          lastName
          email
          phone
          countryCode
          status
          __typename
        }
        __typename
      }
      orderTable {
        id
        no
        status
        __typename
      }
      outstandingAmounts {
        outstanding
        totalDue
        totalPaid
        userId
      }
      paidTotal
      payableTotal
      paymentStatus
      servingStaff {
        id
        firstName
        lastName
        role
        status
        __typename
      }
      __typename
    }
  }
}
    `,
  },
});

// Create and start server
const server = createServer(yoga);

server.listen(4000, () => {
  console.log("🚀 GraphQL API server running at http://localhost:4000/graphql");
  console.log(
    "🔍 GraphiQL interface available at http://localhost:4000/graphql",
  );
});
