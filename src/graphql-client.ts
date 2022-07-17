import { GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  process.env.YTF_GRAPHQL_ENDPOINT ?? "http://localhost:5001/graphql",
  {
    headers: {
      "X-YesBot-Authentication": process.env.YTF_API_AUTH_TOKEN,
    },
  }
);
