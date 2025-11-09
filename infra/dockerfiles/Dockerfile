ARG NODE_VERSION=20.14

FROM node:${NODE_VERSION}-alpine as BASE

WORKDIR /usr/src/

COPY package.json yarn.lock ./
RUN apk add --no-cache git \
  && yarn install --frozen-lockfile \
  && yarn cache clean

FROM node:${NODE_VERSION}-alpine AS BUILD

WORKDIR /usr/src/

COPY --from=BASE /usr/src/node_modules ./node_modules
COPY . .
RUN apk add --no-cache git curl python3 alpine-sdk\
  && yarn build

RUN npx @mapbox/node-pre-gyp rebuild -C /usr/src/node_modules/argon2

FROM node:${NODE_VERSION}-alpine AS PRODUCTION

WORKDIR /usr/src/

COPY --from=BUILD /usr/src/package.json /usr/src/yarn.lock ./

RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline \ 
  && yarn cache clean

COPY --from=BUILD /usr/src/dist ./dist
COPY --from=BUILD /usr/src/infra ./infra
COPY --from=BUILD /usr/src/node_modules/argon2/lib ./node_modules/argon2/lib

ENTRYPOINT [ "/bin/sh", "./infra/entrypoints/entrypoint.sh" ]
