import { graphqlClient } from "../../../graphql-client.js";
import { getSdk } from "./payload.generated.js";
import { User_Roles_MutationInput } from "../../../__generated__/types.js";

export class PayloadService {
  private sdk = getSdk(graphqlClient);

  async createUser(userId: string, roles: User_Roles_MutationInput[]) {
    const response = await this.sdk.CreateUser({ data: { id: userId, roles } });

    return response.createUser;
  }
}
