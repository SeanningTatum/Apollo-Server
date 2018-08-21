const { ApolloServer, gql, ForbiddenError, PubSub } = require('apollo-server');
const admin = require('firebase-admin')
const firebase = require('firebase')
const token = require('./token')
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const context = async ({req}) => {
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token)
    const { name, email } = decodedToken
    return { userDetails: {name, email} }

  } catch (error) {
    return { userDetails: {user: null, email: null} }
  }
}


// The GraphQL schema
const typeDefs = gql`

  type Subscription {
    testAdded: Test
  }

  type Query {
    "A simple type for getting started!"
    hello: String
    tests: [Test]
  }

  type Mutation {
    addTest(test: String): Test
  }

  type Test {
    test: String
  }

  type Service {
    type: String!
  }
`;

const tests = []
const pubsub = new PubSub()
const TEST_ADDED = 'TEST_ADDED'
// A map of functions which return data for the schema.
const resolvers = {
  Subscription: {
    testAdded: {
      subscribe: () => pubsub.asyncIterator([TEST_ADDED])
    }
  },

  Mutation: {
    addTest: (_, args) => {
      pubsub.publish(TEST_ADDED, {testAdded: args})
      return tests.push(args.test)
    } 
  },

  Query: {
    hello: (parent, args, context) => {
      console.log(context)
      const { name, email } = context.userDetails
      if (name && email) {
        return `${name} ${email}`
      } else {
        return 'no name or email!'
      }
    },

    tests: () => tests
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  playground: {
    settings: {
      'editor.cursorShape': 'line' // possible values: 'line', 'block', 'underline'
    }
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
});

