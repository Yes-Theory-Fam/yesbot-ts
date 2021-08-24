FROM node:16.6-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY . .
RUN yarn run tsc

FROM node:16.6-alpine
RUN apk add --no-cache libc6-compat
# Create app directory
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/build ./build
COPY /deployment/docker-entrypoint.sh ./docker-entrypoint.sh

ARG NODE_ENV=production
ARG BOT_TOKEN
ARG GUILD_ID
ARG OUTPUT_CHANNEL_ID
ARG MAP_LINK
ARG MAP_ADD_DM_USER_ID
ARG MODERATOR_ROLE_NAME
ARG ENGINEER_ROLE_NAME
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
ENV PRISMA_DATABASE_URL $PRISMA_DATABASE_URL
ENV VCS_REF $VCS_REF

ENTRYPOINT ["./docker-entrypoint.sh"]
