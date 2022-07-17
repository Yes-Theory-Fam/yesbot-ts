import * as Types from "../../../__generated__/types";

import { GraphQLClient } from "graphql-request";
import * as Dom from "graphql-request/dist/types.dom";
import gql from "graphql-tag";

export type MarkGhostedMutationVariables = Types.Exact<{
  userId: string;
}>;

export type MarkGhostedMutation = {
  __typename?: "Mutation";
  markGhosted: MarkGhostedPayload;
};

export type MarkGhostedPayload = {
  __typename?: "MarkGhostedPayload";
  error?: Types.MarkGhostedError | null;
  success: boolean;
  buddyId?: string | null;
};

export type MarkAsNotGhostingMutationVariables = Types.Exact<{
  userId: string;
}>;

export type MarkAsNotGhostingMutation = {
  __typename?: "Mutation";
  markAsNotGhosting: boolean;
};

export type GetBuddyQueryVariables = Types.Exact<{
  userId: string;
}>;

export type GetBuddyQuery = {
  __typename?: "Query";
  getBuddy: BuddyProjectStatusPayload;
};

export type BuddyProjectStatusPayload = {
  __typename?: "BuddyProjectStatusPayload";
  status: Types.BuddyProjectStatus;
  buddy?: { __typename?: "BuddyProjectEntry"; userId: string } | null;
};

export type UnblockMutationVariables = Types.Exact<{
  userId: string;
}>;

export type UnblockMutation = { __typename?: "Mutation"; unblock: boolean };

export const MarkGhostedDocument = gql`
  mutation markGhosted($userId: String!) {
    markGhosted(userId: $userId) @export(exportName: "MarkGhostedPayload") {
      error
      success
      buddyId
    }
  }
`;
export const MarkAsNotGhostingDocument = gql`
  mutation markAsNotGhosting($userId: String!) {
    markAsNotGhosting(userId: $userId)
  }
`;
export const GetBuddyDocument = gql`
  query getBuddy($userId: String!) {
    getBuddy(userId: $userId) @export(exportName: "BuddyProjectStatusPayload") {
      status
      buddy {
        userId
      }
    }
  }
`;
export const UnblockDocument = gql`
  mutation unblock($userId: String!) {
    unblock(userId: $userId)
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    markGhosted(
      variables: MarkGhostedMutationVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<MarkGhostedMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<MarkGhostedMutation>(MarkGhostedDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "markGhosted",
        "mutation"
      );
    },
    markAsNotGhosting(
      variables: MarkAsNotGhostingMutationVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<MarkAsNotGhostingMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<MarkAsNotGhostingMutation>(
            MarkAsNotGhostingDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "markAsNotGhosting",
        "mutation"
      );
    },
    getBuddy(
      variables: GetBuddyQueryVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<GetBuddyQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetBuddyQuery>(GetBuddyDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "getBuddy",
        "query"
      );
    },
    unblock(
      variables: UnblockMutationVariables,
      requestHeaders?: Dom.RequestInit["headers"]
    ): Promise<UnblockMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UnblockMutation>(UnblockDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "unblock",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
