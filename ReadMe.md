# YesBot - The famous bot that handles and serves Yes Theory Fam Discord server

## Quick note:
This bot is not intended to be run on servers with vastly different channel and role structure than [the Yes Theory Fam Server](https://discord.gg/yestheory).
While possible, chances are it will take quite some effort to adapt the bot to a different server.

## Requirements

To run the bot you will need the following:
- Node 14+ (it might work with earlier versions too but they are untested)
- One of the following
  - Docker to spin up a postgres database with the included Docker file *(recommended)*
  - A postgres database called yesbot with credentials yesbot:yesbot (it doesn't have to contain tables, TypeORM does that for you)

## Local instance

### Run the database
*You can skip this step if you have a postgres server with a database yesbot with credentials yesbot:yesbot running.*

Run the following command to start a docker container with the database:
<!-- TODO -->

```shell
docker run -f Dockerfile
```
### Setup the bot

1. Clone the repo and install the dependencies:
```shell
git clone https://github.com/Yes-Theory-Fam/yesbot-ts.git
cd yesbot-ts
npm install
```

2. Create a src/const.ts file with these variables:

```
export const BOT_TOKEN = "<here goes your bot token>";
export const GUILD_ID = "<here goes the ID of your test server>";
export const OUTPUT_CHANNEL_ID = "<here goes the ID of a channel in your test server that the bot should use for logging>";

// You can leave these empty unless you are working on the !map feature. If you do, let one of the maintainers know!
export const MAP_LINK = "";
export const MAP_ADD_DM_USER_ID = "";

// You can leave these just like this if you are using the Yes Theory Fam server template for your test server.
// Otherwise you can change the role names here if you want.
export const MODERATOR_ROLE_NAME = "Support";
export const ENGINEER_ROLE_NAME = "Server Engineer";
export const COORDINATOR_ROLE_NAME = "Server Coordinator";
export const BUDDY_PROJECT_MATCHING = false;
```

3. Start the bot
```shell
npm run start
```

The bot should now start up, connect to the database and send a ready message in the channel you specified in the `const.ts` file.

## Contributing

We are super grateful that you want to join us in making YesBot the best bot the Discord server can have!
If you want to get right into it, have a look at the [open issues](https://github.com/Yes-Theory-Fam/yesbot-ts/issues).
If you have an idea for the bot that you want to implement, please contact one of the Supports on the server first. Then we can discuss whether your idea is a good fit for the bot before you put in all the time for us to reject your idea!

### Formatting

This codebase uses Prettier for consistent formatting. When writing code for the bot, please check for linting issues using
```shell
npm run lint
```

and fix potential errors and warnings you might find. Quite a few can be fixed automatically using
```shell
npm run lint:fix
```

### Pull requests

If your pull requests becomes unmergable due to merge conflicts, have patience. We will get to it and resolve them!
Please don't solve them yourself as it makes the git history a little more chaotic.
