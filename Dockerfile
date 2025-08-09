FROM node:22.18.0-alpine AS base
RUN apk add --no-cache libc6-compat && \
    corepack enable

FROM base as deps

WORKDIR /usr/src/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN yarn install --frozen-lockfile

FROM base as builder
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

ARG YTF_GRAPHQL_SCHEMA_ENDPOINT

RUN yarn prisma generate && yarn graphql-codegen && yarn run tsc

FROM base
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /usr/src/app/build ./build
COPY /deployment/docker-entrypoint.sh ./docker-entrypoint.sh

ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]
