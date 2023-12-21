import { graphqlClient } from "../../../graphql-client";
import { getSdk } from "./payload.generated";
import { User_Roles_MutationInput } from "../../../__generated__/types";

export class PayloadService {
  private sdk = getSdk(graphqlClient);

  async createUser(userId: string, roles: User_Roles_MutationInput[]) {
    const response = await this.sdk.CreateUser({ data: { id: userId, roles } });

    return response.createUser;
  }
}
