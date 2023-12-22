import { mysqlTable } from 'drizzle-orm/mysql-core';
import { flags } from './types/bitflag';
import { snowflake } from './types/snowflake';

export const guilds = mysqlTable('guilds', {
  id: snowflake('id').primaryKey(),
  features: flags('features', [
    'onlySendLinks', 
    'waitForValidEmbed',
    'cleanupParentMessage'
  ]).notNull(),
});

export type Guild = typeof guilds.$inferSelect;