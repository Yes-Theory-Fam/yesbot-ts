# Install dependencies only when needed
FROM node:14.17-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./.npmrc ./.npmrc
RUN npm install

# Rebuild the source code only when needed
FROM node:14.17-alpine AS builder
WORKDIR /usr/src/app
COPY . .
COPY --from=deps /usr/src/app/node_modules ./node_modules
RUN npm run tsc

FROM node:14.17-alpine
# Create app directory
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/package-lock.json ./package-lock.json
COPY --from=builder /usr/src/app/build ./build

ARG NODE_ENV=production
ARG BOT_TOKEN
ARG GUILD_ID
ARG OUTPUT_CHANNEL_ID
ARG MAP_LINK
ARG MAP_ADD_DM_USER_ID
ARG MODERATOR_ROLE_NAME
ARG ENGINEER_ROLE_NAME
ARG COORDINATOR_ROLE_NAME
ARG BUDDY_PROJECT_MATCHING
ARG PRISMA_DATABASE_URL
ARG VCS_REF=0

ENV NODE_ENV $NODE_ENV
ENV BOT_TOKEN $BOT_TOKEN
ENV GUILD_ID $GUILD_ID
ENV OUTPUT_CHANNEL_ID $OUTPUT_CHANNEL_ID
ENV MAP_LINK $MAP_LINK
ENV MAP_ADD_DM_USER_ID $MAP_ADD_DM_USER_ID
ENV MODERATOR_ROLE_NAME $MODERATOR_ROLE_NAME
ENV ENGINEER_ROLE_NAME $ENGINEER_ROLE_NAME
ENV COORDINATOR_ROLE_NAME $COORDINATOR_ROLE_NAME
ENV BUDDY_PROJECT_MATCHING $BUDDY_PROJECT_MATCHING
ENV PRISMA_DATABASE_URL $PRISMA_DATABASE_URL
ENV VCS_REF=$VCS_REF

RUN ls -lisa
RUN ls -lisa ./build

CMD [ "npm", "run", "start:prod" ]
