import { BuddyProjectMatching } from "./matching/matching";

export const enum BuddyProjectError {
  NOT_SIGNED_UP = "NOT_SIGNED_UP",
  NOT_MATCHED = "NOT_MATCHED",
}

export const commonMessages: Record<BuddyProjectError, string> = {
  [BuddyProjectError.NOT_SIGNED_UP]:
    "It seems you have not signed up to this year's iteration of the buddy project! You can join at https://yestheory.family/buddyproject !",
  [BuddyProjectError.NOT_MATCHED]:
    "It seems you haven't been matched yet! Have some patience, I will message you with your buddy and questions once you are matched, pinky promise!",
};
