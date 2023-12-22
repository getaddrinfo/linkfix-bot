import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './db/drizzle',
  driver: 'mysql2',
  dbCredentials: {
    user: 'linkfix_dev',
    database: 'linkfix_dev',
    host: 'localhost',
    password: 'root',
    port: 3306
  }
} satisfies Config;