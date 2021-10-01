# Contributing to YesBot

We are super grateful that you want to join us in making YesBot the best bot the Discord server can have! Be it issues,
pull requests or general ideas and discussion, we are looking forward to seeing it.

This document contains some guidelines for contributing so make sure to read through it to make things easier.

## Issues

If you found a problem in YesBot and would like to let us know about it, head to
the [issues](https://github.com/Yes-Theory-Fam/yesbot-ts/issues?utf8=%E2%9C%93&q=is:issue) and see if the issue you
found has already been reported. If you found a match, just upvote it with the 👍 reaction.

If you couldn't find anything that looks like your problem, create a new one containing the following information:

- Clear and descriptive title ("Bot doesn't work" is _not_ helpful)
- Description of the issue with the following:
    - What you did
    - What you thought would happen
    - What did happen
- If you are able to reproduce this problem repeatedly and reliably, include step by step instructions on how to
  recreate the issue

## Pull Requests (PRs)

We are happy if you want to add something to the bot! To help make things easier, please follow this advice:

### Working on issues

When working on an issue, please send a comment under that issue, so everyone knows about it and someone else doesn't
accidentally start working on the same thing you have almost finished. We will assign you so that it's clear to
everyone.

The other way around: It probably doesn't make a lot of sense to start working on an issue that already has someone
assigned. If you have doubts, that the assigned person is going to finish the task, let us know and we will see if we
transfer the issue to you!

### Formatting

This codebase uses Prettier for consistent formatting. Before submitting a PR for the bot, please check for linting
issues using

```bash
yarn run lint
```

then fix potential errors and warnings you might find. Quite a few can be fixed automatically using

```bash
yarn run lint:fix
```

### Merge conflicts

If your pull request cannot be merged due to a merge conflict, have patience. We will get to it and resolve them! Please
don't solve them yourself as it might make the git history a little more chaotic.

## Development

This section of the document includes information on what to consider while developing YesBot.

### Project structure

The bot's main code is contained in the `src` directory which contains several sub-directories:

- collections - Files containing static data that the bot uses for certain tasks
- common - Shared code for various things
- events - Event handlers for the different events discord.js exposes
- programs - Code containing logic for all the commands and features of the bot. This directory contains an `index.ts`
  which reexports all exports from all files in this folder, please do so to, when adding your own feature.
- scripts - Standalone scripts that are designed to be manually run for one-off tasks (like importing birthdays for
  example)

It also contains two single files:

- prisma.ts - Simple setup of the Prisma database connection
- index.ts - Creates and exports the discord.js Client used in the entire application. This is the entry point for the
  bot.

### Requirements

To work on the bot you need the following:

- [Node](https://nodejs.org/) 16.6.0 or newer
- A PostgreSQL server with a database called `yesbot`, username `yesbot` and password (you guessed it) `yesbot`
    - (recommended) You can use [Docker](https://www.docker.com/get-started)
      with [Docker Compose](https://docs.docker.com/compose/install/) and the `docker-compose.yml` in this repository to
      launch one in one command
    - [Download](https://www.postgresql.org/download/) and install PostgreSQL on your host system, then create and
      configure a database following the requirements above
- A Discord server created from [this template](https://discord.com/template/TEFgdaFHR9xR)
- A Discord application with a bot token (get started
  at [https://discord.com/developers](https://discord.com/developers))
    - After creating a Discord application click on (Bot → Add Bot).
    - In the Bot tabs on your newly created Discord application, this is where you will find your Bot token to be used
      later on in `.env`
- Developer mode in Discord enabled (Settings → Appearance → Advanced → Developer Mode) to be able to copy IDs from
  servers, channels, messages, and everything else that has an ID

### Local instance

To allow your bot to run, you have to invite the bot into the server you created:

1. Select your application with the bot token [here](https://discord.com/developers/applications/).
2. Click OAuth2 in the left menu
3. In the list of scopes, select `bot`
4. In the list of bot permissions (shows up after step 3), select `Administrator`
5. Copy and open the URL created in the scopes section
6. Select the server created from the template and click Continue, then Authorize (you might also need to complete a
   Captcha)

Now the bot is on your server and can do things once started. We will get to that next. For the following steps, you
will need the code on your computer, so:

1. [Fork](https://github.com/Yes-Theory-Fam/yesbot-ts/fork) the repository to your user

2. Clone the repo and change the directory to the project for all future commands:

```bash
git clone https://github.com/your-username/yesbot-ts.git
cd yesbot-ts
```

#### Run the database

_Skip this step if you have a postgres server with a database `yesbot` with credentials `yesbot:yesbot` running._

Run the following command in the root directory of the project to start a docker container with the database:

```bash
docker-compose up postgres
# or docker-compose up -d postgres
# if you want to reuse your terminal; in this case you can shut down the container with docker-compose down in the same directory
```

Ensure that you have Docker running and no other connections on Port 5432 as this is where YesBot connects to.

#### Set up the bot

1. Make sure your NPM
   is [configured to install the YTF Database package](https://github.com/Yes-Theory-Fam/database#npm-configuration).

2. Install the dependencies:

```bash
yarn install
```

3. Create an `.env` in the root directory and copy the `.env.example`. Change the values to match your test server.

4. Set up the tables in the database

```bash
yarn prisma db push
```

5. Start the bot

```bash
yarn run start
```

The bot should now start up, connect to the database and send a ready message in the channel you specified in
the `.env` file.
