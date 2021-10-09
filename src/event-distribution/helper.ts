import { CommandHandler, DiscordEvent } from ".";
import {
  HIOC,
  InstanceOrConstructor,
  StringIndexedHIOCTree,
} from "./types/hioc";

export const getIdFromCategoryName = (name: string) =>
  `c_${name.toLowerCase()}`;

export const getIocName = <T extends DiscordEvent>(
  ioc: InstanceOrConstructor<CommandHandler<T>>
) => {
  return typeof ioc === "function" ? ioc.name : ioc.constructor.name;
};

export const addToTree = <T extends DiscordEvent>(
  keys: string[],
  hioc: HIOC<T>,
  tree: StringIndexedHIOCTree<T>
) => {
  if (keys.length === 1) {
    const [key] = keys;
    tree[key] ??= [];
    const handlers = tree[key] as HIOC<T>[];

    handlers.push(hioc);
    return;
  }

  const [key, ...rest] = keys;

  const subTree = tree[key];
  if (Array.isArray(subTree)) {
    tree[key] = { "": subTree };
  }

  tree[key] ??= {};
  addToTree(rest, hioc, tree[key] as StringIndexedHIOCTree<T>);
};
