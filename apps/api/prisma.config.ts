import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Load .env file
config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL') || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
})
