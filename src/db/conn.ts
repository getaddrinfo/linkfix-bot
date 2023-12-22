import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2';

import * as schema from './schema';

const env = process.env.NODE_ENV ?? 'production';

export const mysql = createPool({
  user: `linkfix_${env}`,
  database: `linkfix_${env}`,
  password: 'root',
  port: 3306,
  host: '127.0.0.1',
  multipleStatements: true
});

export const db = drizzle(mysql, { schema, mode: 'default' });