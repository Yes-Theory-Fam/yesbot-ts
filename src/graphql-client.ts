import { GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  process.env.YTF_GRAPHQL_ENDPOINT ?? "http://localhost:5001/graphql"
);
