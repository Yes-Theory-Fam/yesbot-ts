import { Snowflake } from "discord.js";

interface State {
  ignoredGroupDMs: Array<Snowflake>,
}

const state: State = {
  ignoredGroupDMs: [],
};

export default state;
export type { State };
