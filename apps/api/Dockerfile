FROM node:22-alpine

WORKDIR /app

# Copy root config
COPY package.json .
COPY pnpm-workspace.yaml .
COPY tsconfig.base.json .

# Copy shared packages
COPY packages ./packages

# Copy app source
COPY apps/api ./apps/api

# Install dependencies (including workspace)
RUN apk add --no-cache openssl
RUN npm install -g pnpm
RUN pnpm install --shamefully-hoist

# Build
WORKDIR /app/apps/api
# Set placeholder DATABASE_URL for prisma generate (actual value provided at runtime)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN pnpm build

# Ensure production dependencies are available locally
RUN pnpm prune --prod

# Regenerate Prisma client after pruning
RUN npx prisma generate

# Copy entrypoint script
COPY apps/api/entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Use entrypoint to run migrations before starting
ENTRYPOINT ["./entrypoint.sh"]
