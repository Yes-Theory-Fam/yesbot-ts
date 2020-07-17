import { Snowflake } from "discord.js";

interface State {
  ignoredGroupDMs: Array<Snowflake>;
  // Map from channelid to running timeout
  voiceChannels: Map<Snowflake, NodeJS.Timeout>;
}

const state: State = {
  ignoredGroupDMs: [],
  voiceChannels: new Map(),
};

export default state;
export type { State };
