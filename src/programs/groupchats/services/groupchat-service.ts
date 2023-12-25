import { getSdk } from "./groupchat.generated";
import { graphqlClient } from "../../../graphql-client";

export class GroupchatService {
  private readonly sdk = getSdk(graphqlClient);

  async mayCreateGroupchat(userId: string): Promise<boolean> {
    const response = await this.sdk.MayCreateGroupchat({ userId });

    return response.mayOperate ?? false;
  }

  async createGroupchat(
    userId: string,
    groupchatData: {
      name: string;
      url: string;
      platform: string;
      description?: string;
    }
  ): Promise<number | null> {
    const response = await this.sdk.CreateGroupchat({
      userId,
      data: groupchatData,
    });

    return response.mimicUserOperation ?? null;
  }
}
