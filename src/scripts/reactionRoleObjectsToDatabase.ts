import "../db"; // imported for side effect
import Tools from "../common/tools";
import { ReactionRoleRepository, ReactionRole } from "../entities/ReactionRole";
import { setTimeout } from "timers";

// // {"messageId":"668469840981393408","reaction":"🏗️","roleId":"668435737401753611","channelId":"668435977051570187"}
interface JSONReactionRole {
  channelId: string;
  messageId: string;
  reaction: string;
  roleId: string;
}

async function importReactionRoleObjects() {
  const reactionRoleRepository = await ReactionRoleRepository();
  const reactionRoles = (<unknown>(
    await Tools.resolveFile("reactRoleObjects")
  )) as JSONReactionRole[];

  const existingReactionRoles = await reactionRoleRepository.find();
  const existingReactionRolesChannelMsgReaction = existingReactionRoles.map(
    (reactionRole) => [
      reactionRole.channelId,
      reactionRole.messageId,
      reactionRole.reaction,
    ]
  );

  const toCreateSource = reactionRoles
    .filter(
      ({ channelId, messageId, reaction }) =>
        !existingReactionRolesChannelMsgReaction.includes([
          channelId,
          messageId,
          reaction,
        ])
    )
    .map((reactionRole) =>
      reactionRoleRepository.create({
        channelId: reactionRole.channelId,
        messageId: reactionRole.messageId,
        reaction: reactionRole.reaction,
        roleId: reactionRole.roleId,
      })
    );

  let toCreate2: JSONReactionRole[] = [];
  for (let i = 0; i < toCreateSource.length; i++) {
    const current = toCreateSource[i];
    if (
      toCreate2.find(
        (existing) =>
          existing.channelId === current.channelId &&
          existing.messageId === current.messageId &&
          (existing.reaction === current.reaction ||
            existing.roleId === current.roleId)
      )
    ) {
      console.warn(
        `Skipping duplicate reactionRoleObject: ${current.messageId}+${current.reaction} for chan ${current.channelId}, using existing.`
      );
      continue;
    }
    if (
      !current.channelId ||
      !current.messageId ||
      !current.reaction ||
      !current.roleId
    ) {
      console.warn("Skipping item with missing required parameters");
      continue;
    }
    toCreate2.push(current);
  }

  console.log(
    `Found ${toCreate2.length} items to import. Skipping ${existingReactionRoles.length} existing items.`
  );

  if (toCreate2.length === 0) {
    console.log("No new items to insert.");
    return;
  }

  try {
    await reactionRoleRepository
      .createQueryBuilder()
      .insert()
      .into(ReactionRole)
      .values(toCreate2)
      .execute();
  } catch (err) {
    console.log("Failed to mass-import reaction role objects. Error: ", err);
  }

  console.log("Done");
  return;
}

const timeout =
  (process.env.YESBOT_SCRIPT_TIMEOUT &&
    parseInt(process.env.YESBOT_SCRIPT_TIMEOUT, 10)) ||
  1000;
console.log(
  `Waiting ${timeout}ms before starting import. Configure with environment variable YESBOT_SCRIPT_TIMEOUT=${timeout}`
);
setTimeout(importReactionRoleObjects, timeout);
