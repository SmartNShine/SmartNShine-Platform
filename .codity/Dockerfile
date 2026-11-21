ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ${BASE_IMAGE}
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/static-server.mjs ./server.mjs
EXPOSE 8080
CMD ["node", "server.mjs"]
