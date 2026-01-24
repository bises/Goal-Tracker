FROM node:22-alpine AS builder

# Accept build argument for API URL
ARG VITE_API_URL=http://localhost:3000

WORKDIR /app

# Copy root config
COPY package.json .
COPY pnpm-workspace.yaml .
COPY tsconfig.base.json .

# Copy shared packages
COPY packages ./packages

# Copy app source
COPY apps/web ./apps/web

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Build with environment variable
WORKDIR /app/apps/web
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
