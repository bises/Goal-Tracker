FROM node:18-alpine

WORKDIR /app

# Copy root config
COPY package.json .
COPY pnpm-workspace.yaml .
COPY tsconfig.base.json .

# Copy app source
COPY apps/api ./apps/api

# Install dependencies (including workspace)
RUN apk add --no-cache openssl
RUN npm install -g pnpm
RUN pnpm install --shamefully-hoist

# Build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm build

# Ensure production dependencies are available locally
RUN npm install --omit=dev

# Copy entrypoint script
COPY apps/api/entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Use entrypoint to run migrations before starting
ENTRYPOINT ["./entrypoint.sh"]
