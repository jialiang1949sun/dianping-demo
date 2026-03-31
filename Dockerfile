FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

RUN node ./node_modules/vite/bin/vite.js build
RUN node ./node_modules/typescript/bin/tsc -p server/tsconfig.server.json


FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/api ./api
COPY --from=build /app/uploads ./uploads

EXPOSE 3002

CMD ["node", "./dist-server/server.js"]
