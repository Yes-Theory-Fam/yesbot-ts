import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
} from "../types/base";
import {
  Collection,
  GuildMember,
  PartialGuildMember,
  Role,
  Snowflake,
} from "discord.js";
import { HIOC, StringIndexedHIOCTree } from "../types/hioc";
import { addToTree } from "../helper";

export interface GuildMemberUpdateEventHandlerOptions {
  event: DiscordEvent.GUILD_MEMBER_UPDATE;
  stateful?: false;
  roleNamesAdded?: string[];
  roleNamesRemoved?: string[];
}

export type GuildMemberUpdateArgument = GuildMember | PartialGuildMember;

export type GuildMemberUpdateHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.GUILD_MEMBER_UPDATE,
    [GuildMemberUpdateArgument, GuildMemberUpdateArgument]
  >;

const addedRoleKey = "added";
const removedRoleKey = "removed";

export const addGuildMemberUpdateHandler: AddEventHandlerFunction<GuildMemberUpdateEventHandlerOptions> =
  (options, ioc, tree) => {
    const {
      roleNamesAdded,
      roleNamesRemoved,
    }: GuildMemberUpdateEventHandlerOptions = {
      roleNamesAdded: [],
      roleNamesRemoved: [],
      ...options,
    };

    const addedLength = roleNamesAdded.length;
    const removedLength = roleNamesRemoved.length;

    const isGeneralHandler = addedLength === 0 && removedLength === 0;
    if (isGeneralHandler) {
      addRoleHandlersToTree(tree, "", [""], { ioc, options });
      return;
    }

    addRoleHandlersToTree(tree, addedRoleKey, roleNamesAdded, { ioc, options });
    addRoleHandlersToTree(tree, removedRoleKey, roleNamesRemoved, {
      ioc,
      options,
    });
  };

const addRoleHandlersToTree = (
  tree: StringIndexedHIOCTree<DiscordEvent.GUILD_MEMBER_UPDATE>,
  firstKey: typeof addedRoleKey | typeof removedRoleKey | "",
  secondKeys: string[],
  hioc: HIOC<DiscordEvent.GUILD_MEMBER_UPDATE>
) => {
  for (const secondKey of secondKeys) {
    addToTree([firstKey, secondKey], hioc, tree);
  }
};

export const extractGuildMemberUpdateInfo: ExtractInfoForEventFunction<DiscordEvent.GUILD_MEMBER_UPDATE> =
  (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const oldRolesLength = oldRoles.size;
    const newRoles = newMember.roles.cache;
    const newRolesLength = newRoles.size;

    if (oldRolesLength === newRolesLength) {
      return {
        member: newMember,
        isDirectMessage: false,
        handlerKeys: ["", ""],
      };
    }

    const firstKey =
      oldRolesLength > newRolesLength ? removedRoleKey : addedRoleKey;

    const diff = getRoleDiff(oldRoles, newRoles);

    const toInfos = (roleChange: Role) => {
      return {
        handlerKeys: [firstKey, roleChange.name],
        member: newMember,
        isDirectMessage: false,
      };
    };

    return [...diff.added.map(toInfos), ...diff.removed.map(toInfos)];
  };

const getRoleDiff = (
  oldRoles: Collection<Snowflake, Role>,
  newRoles: Collection<Snowflake, Role>
): { added: Role[]; removed: Role[] } => {
  const oldIds = oldRoles.map(({ id }) => id);
  const newIds = newRoles.map(({ id }) => id);

  const added = newIds
    .filter((id) => !oldIds.includes(id))
    .map((id) => newRoles.get(id));
  const removed = oldIds
    .filter((id) => !newIds.includes(id))
    .map((id) => oldRoles.get(id));

  return { added, removed };
};
