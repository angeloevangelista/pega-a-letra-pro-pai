FROM node:20.15-alpine as builder

WORKDIR /app

COPY . .

RUN yarn install && yarn tsc

FROM node:20.15-alpine

WORKDIR /app

COPY --from=builder  /app/dist /app/dist
COPY --from=builder  /app/package.json /app
COPY --from=builder  /app/yarn.lock /app

RUN yarn install --production --frozen-lockfile

ENTRYPOINT [ "npm", "start" ]
