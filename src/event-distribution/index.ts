import { EventDistribution } from "./event-distribution.js";

const distribution = new EventDistribution();
export default distribution;

export * from "./types/handler.js";
export * from "./types/base.js";
export * from "./command-decorator.js";

export { DiscordEvent } from "./types/base.js";
