import { graphqlClient } from "../../../graphql-client";
import {
  BuddyProjectStatusPayload,
  getSdk,
  MarkGhostedMutation,
  MarkGhostedPayload,
} from "./buddy-project.generated";

export class BuddyProjectService {
  private sdk = getSdk(graphqlClient);

  async getBuddy(userId: string): Promise<BuddyProjectStatusPayload> {
    const response = await this.sdk.getBuddy({ userId });

    return response.getBuddy;
  }

  async markGhosted(userId: string): Promise<MarkGhostedPayload> {
    const response = await this.sdk.markGhosted({ userId });

    return response.markGhosted;
  }

  async markAsNotGhosting(userId: string): Promise<boolean> {
    const response = await this.sdk.markAsNotGhosting({ userId });

    return response.markAsNotGhosting;
  }

  async unblock(userId: string): Promise<boolean> {
    const response = await this.sdk.unblock({ userId });

    return response.unblock;
  }
}
