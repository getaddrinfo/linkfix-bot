import type { GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import { run, type Service } from "../service";
import { getServices, ServiceId } from "../service/services";
import { getOrCreate } from "../db/guild/getOrCreate";
import { Guild } from "../db/schema";
import { send } from "../send";
import { future } from "../stores";

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
    const [futures, nonReasonable] = await Promise.all([
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

    console.log(
      futures,
      nonReasonable
    )

    const all = [...(futures?.postInstantly ?? []), ...(nonReasonable ?? [])];
    if (all.length === 0) return;

    await send(all, {
      channelId: message.channel_id,
      guildId: message.guild_id,
      parentId: message.id,
      features: guild.features
    }, { willBeEdited: futures?.hasFutures ?? false });

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
    parentId: message.id,
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

  const postInstantly = [];
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
        postInstantly.push(rewritten);
      }

      // if discord had it cached, and the link isn't healthy, then it's likely dead: maybe try and fetch,
      // then edit the link out of the message if it is *actually* dead? 
      // TODO: behaviour described above
    }
  }

  const hasFutures = Object.keys(futures).length !== 0;

  if (hasFutures) {
    await future.set(
      message.channel_id,
      { 
        tiktok: futures.tiktok ?? {},
        parentId: message.id
      }
    )
  }

  return { postInstantly, hasFutures };
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