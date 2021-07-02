import { InstanceOrConstructor } from "./types/hioc";
import { DiscordEvent } from "./types/base";

const getIocName = (ioc: InstanceOrConstructor<DiscordEvent>) => {
  return typeof ioc === "function" ? ioc.name : ioc.constructor.name;
};
