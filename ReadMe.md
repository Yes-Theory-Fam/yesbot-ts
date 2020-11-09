# YesBot - The famous bot that handles and serves Yestheory fam Discord server

To run, set up a src/const.ts file with these variables:

```
export const BOT_TOKEN = "",
  GUILD_ID = "",
  AUSTRALIA_IMAGE_URL = "",
  CANADA_IMAGE_URL = "",
  UK_IMAGE_URL = "",
  USA_IMAGE_URL = "",
  MODERATOR_ROLE_NAME = "",
  MAP_LINK = "",
  MAP_ADD_DM_USER_ID ="",
  OUTPUT_CHANNEL_ID = "",
  ENGINEER_ROLE_NAME = "",
  BUDDY_PROJECT_MATCHING = "",
  COORDINATOR_ROLE_NAME = "";
```

# Development
- To start this up, follow this steps:
    1. Run `npm install` (if this is your first time pulling down the code)
    2. Fill in the information in `src/const.ts` file.
    3. Run `npm run start`
    4. Before pushing up code to github, run `npm run lint`
    5. If there are any errors, please run `npm run lint:fix`.

# Deployment
