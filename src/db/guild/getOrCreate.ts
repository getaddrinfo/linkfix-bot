import { eq } from "drizzle-orm"
import { db } from "../conn"
import { Guild, guilds } from "../schema"

const defaultGuild: Omit<Guild, 'id'> = {
  features: {
    onlySendLinks: false,
    waitForValidEmbed: false,
    cleanupParentMessage: true
  }
}

export const getOrCreate = async (id: string) => {
  let existingGuild = await db.query.guilds.findFirst({
    where: eq(guilds.id, id)
  });

  if (existingGuild) return existingGuild;

  let createdGuild = {
    id,
    ...defaultGuild
  };

  await db.insert(guilds).values(createdGuild);
  return createdGuild;
} 