import type { GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import { run, type Service } from "../service";
import { getServices, ServiceId } from "../service/services";
import { getOrCreate } from "../db/guild/getOrCreate";
import { Guild } from "../db/schema";
import { send } from "../send";
import { FutureStore } from "../features/future/store";
import { createMemoryStore } from "../features/future/memory";

export let store: FutureStore = createMemoryStore();

export const onMessageCreate = async (message: GatewayMessageCreateDispatchData) => {
  if (
    message.author.bot 
    || !message.guild_id 
    || !message.content
  ) return;


  let services = getServices(message.content);
  if (services.length === 0) return;

  const guild = await getOrCreate(message.guild_id);

  if (guild.features.waitForValidEmbed) {
    const [left, right] = await Promise.all([
      handleValidLinksOnly(
        message, 
        guild, 
        services.filter((service) => !!service.features.waitForEmbed)
      ),
      handleInstantRepost(
        message,
        guild,
        services.filter((service) => !service.features.waitForEmbed)
      )
    ]);

    const all = [...(left ?? []), ...(right ?? [])];
    if (all.length === 0) return;

    await send(all, {
      channelId: message.channel_id,
      guildId: message.guild_id,
      features: guild.features
    });

    return;
  }

  const result = await handleInstantRepost(
    message,
    guild,
    services
  );

  if (result === null) return;
    await send(result, {
      channelId: message.channel_id,
      guildId: message.guild_id,
      features: guild.features
    });
  }

const handleValidLinksOnly = async (
  message: GatewayMessageCreateDispatchData,
  _guild: Guild,
  services: Service[]
) => {
  const rewrites = run(message.content, services);  
  if (rewrites === null) return null;

  const now = [];
  const futures: Partial<Record<ServiceId, Record<string, string>>> = {};
  
  for(const rewrite of rewrites) {
    for (const [originalLink, rewritten] of Object.entries(rewrite.links)) {
      const embed = message.embeds.find((embed) => embed.url && embed.url.startsWith(originalLink));

      // if we don't have an embed, discord didn't have it cached...
      if (!embed) {
        futures[rewrite.service.id as ServiceId] ??= {};
        futures[rewrite.service.id as ServiceId]![originalLink] = rewritten;

        continue;
      };


      // if we do have an embed, and the original link is healthy, then
      // discord had it cached
      if (rewrite.service.features.waitForEmbed?.isOriginalLinkHealthy(embed)) {
        now.push(rewritten);
      }

      // if discord had it cached, and the link isn't healthy, then it's likely dead: maybe try and fetch,
      // then edit the link out of the message if it is *actually* dead? 
      // TODO: behaviour described above
    }
  }

  if (Object.keys(futures).length) {
    await store.set(
      message.channel_id,
      { 
        tiktok: futures.tiktok ?? {},
        parentId: message.id
      }
    )
  }

  console.log("check the embed in future !!!", futures);
  console.log("send the rewritten links now !!!", now);

  return now;
}

const handleInstantRepost = async (
  message: GatewayMessageCreateDispatchData,
  _guild: Guild,
  services: Service[]
) => {
  const rewrites = run(message.content, services);
  if (rewrites === null) return null;

  return rewrites.reduce(
    (acc, { links }) => acc.concat(Object.values(links)),
    [] as string[]
  );
}