import type { GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import { run, type Service } from "../service";
import { rest } from "../rest";
import { getServices } from "../service/services";
import { getOrCreate } from "../db/guild/getOrCreate";
import { Guild } from "../db/schema";

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
    await Promise.allSettled([
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
    return;
  }

  return await handleInstantRepost(
    message,
    guild,
    services
  )
}

const handleValidLinksOnly = async (
  message: GatewayMessageCreateDispatchData,
  _guild: Guild,
  services: Service[]
) => {
  const rewrites = run(message.content, services);
  console.log("result", rewrites);

  const futures = [];
  const now = [];
  
  console.log("embeds", message.embeds);

  for(const rewrite of rewrites) {
    for (const [originalLink, rewritten] of Object.entries(rewrite.links)) {
      const embed = message.embeds.find((embed) => embed.url === originalLink);

      // if we don't have an embed, discord didn't have it cached...
      if (!embed) {
        futures.push(originalLink);
        continue;
      };


      // if we do have an embed, and the original link is healthy, then
      // discord had it cached
      if (rewrite.service.features.waitForEmbed?.isOriginalLinkHealthy(embed)) {
        now.push(rewritten);
      }

      // if discord had it cached, and the link isn't healthy, then it's likely dead:  don't try and fetch
    }
  }

  console.log("update in future!!!", futures);
  console.log("send right now!!!", now);

  console.warn('handleValidLinksOnly: unsupported');
}

const handleInstantRepost = async (
  message: GatewayMessageCreateDispatchData,
  guild: Guild,
  services: Service[]
) => {
  const rewrites = run(message.content, services);
  if (rewrites.length === 0) return;

  const links = rewrites.reduce((acc, { links }) => acc + Object.values(links).join('\n'), '');
  if (guild.features.onlySendLinks) {
    await rest.post(`/channels/${message.channel_id}/messages`, {
      body: {
        content: links,
        allowed_mentions: { parse: [] }
      }
    }); 

    return; 
  }

  const total = rewrites.reduce((acc, { links }) => acc + Object.values(links).length, 0);
  
  await rest.post(`/channels/${message.channel_id}/messages`, {
    body: {
      content: `Fixed ${total} link${total === 1 ? '' : 's'}:\n${links}`,
      allowed_mentions: { parse: [] }
    }
  });
}