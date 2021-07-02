import { ChannelResolvable, OverwriteResolvable } from "discord.js";

export interface TextChannelOptions {
  topic?: string;
  nsfw?: boolean;
  type?: "text";
  parent?: ChannelResolvable;
  permissionOverwrites?: Array<OverwriteResolvable>;
  options?: number;
  reason?: string;
}

export interface GroupInteractionSuccess {
  groupName: string;
  success: true;
}

export interface GroupInteractionError {
  groupName: string;
  success: false;
  message: string;
}
