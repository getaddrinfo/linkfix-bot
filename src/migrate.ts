import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, mysql } from './db/conn';

(async() => {
  await migrate(db, { migrationsFolder: './db/drizzle'});
  await mysql.end();
})()

