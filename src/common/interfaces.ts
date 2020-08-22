import Discord, { OverwriteResolvable } from "discord.js";

export interface TextChannelOptions {
  topic?: string;
  nsfw?: boolean;
  type?: "text";
  parent?: Discord.ChannelResolvable;
  permissionOverwrites?: Array<OverwriteResolvable>;
  options?: number;
  reason?: string;
}
