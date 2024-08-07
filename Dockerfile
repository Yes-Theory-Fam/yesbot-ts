FROM node:21.7.3-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN yarn install --frozen-lockfile

FROM node:21.7.3-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

ARG YTF_GRAPHQL_SCHEMA_ENDPOINT

RUN yarn prisma generate && yarn graphql-codegen && yarn run tsc

FROM node:21.7.3-alpine
RUN apk add --no-cache libc6-compat
# Create app directory
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/build ./build
COPY /deployment/docker-entrypoint.sh ./docker-entrypoint.sh

ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]
