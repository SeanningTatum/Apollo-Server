const { ApolloServer, gql } = require('apollo-server');
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
    console.log(decodedToken)
  } catch (error) {
    console.error(error)
  }

}

// The GraphQL schema
const typeDefs = gql`
  type Query {
    "A simple type for getting started!"
    hello: String
  }

  type Service {
    type: String!
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: (parent, args, context) => {
      // console.log(context)
      return 'world'
    }
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

