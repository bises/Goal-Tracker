FROM node:18-alpine as builder

WORKDIR /app

# Copy root config
COPY package.json .
COPY pnpm-workspace.yaml .
COPY tsconfig.base.json .

# Copy app source
COPY apps/web ./apps/web

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Build
WORKDIR /app/apps/web
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
