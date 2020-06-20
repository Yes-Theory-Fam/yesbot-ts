import { Snowflake } from "discord.js";

interface State {
  ignoredGroupDMs: Array<Snowflake>;
  // Map from user id to channel id
  voiceChannels: Map<
    Snowflake,
    { channelId: Snowflake; timeouts: Array<NodeJS.Timeout> }
  >;
}

const state: State = {
  ignoredGroupDMs: [],
  voiceChannels: new Map(),
};

export default state;
export type { State };
