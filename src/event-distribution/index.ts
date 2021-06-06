import { EventDistribution } from "./event-distribution";

const distribution = new EventDistribution();
export default distribution;

export * from "./types/handler";
export * from "./types/base";
export * from "./command-decorator";

export { DiscordEvent } from "./types/base";
