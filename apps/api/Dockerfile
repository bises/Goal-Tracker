FROM node:18-alpine

WORKDIR /app

# Copy root config
COPY package.json .
COPY pnpm-workspace.yaml .
COPY tsconfig.base.json .

# Copy app source
COPY apps/api ./apps/api

# Install dependencies (including workspace)
RUN npm install -g pnpm
RUN pnpm install --shamefully-hoist

# Build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm build

# Ensure production dependencies are available locally
RUN npm install --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
