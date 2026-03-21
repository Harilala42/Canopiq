FROM node:20-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

FROM base AS dev

WORKDIR /app
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS prod

WORKDIR /app
COPY . .

RUN npm run build
