import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import { REST } from "@discordjs/rest";
import { run } from "./services";
import { httpServer } from "./api";

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
const manager = new WebSocketManager({
  token: process.env.DISCORD_BOT_TOKEN!,
  intents: 1 << 9 | 1 << 15, // guild messages + message content
  rest,
});

httpServer(manager);

manager.on(WebSocketShardEvents.Ready, ({ shardId }) => console.log(`[shard(${shardId})]: ready`));
manager.on(WebSocketShardEvents.Error, ({ shardId, error }) => {
  console.log(`[shard(${shardId})]: error ${error.name}: ${error.message}`);
});
manager.on(WebSocketShardEvents.Resumed, ({ shardId }) => console.log(`[shard(${shardId})]: resumed`));

/**
 * Checks for a `MESSAGE_CREATE` event, and runs the matchers on it
 * if it is such. Ignores all other events.
 */
manager.on(WebSocketShardEvents.Dispatch, async ({ data }) => {
  if (data.op !== 0) return;
  if (data.t !== 'MESSAGE_CREATE') return;

  const message = data.d;

  if (message.author.bot) return;
  if (!message.content) return;

  const rewrites = run(message.content);
  if (rewrites.length === 0) return;

  const total = rewrites.reduce((acc, { links }) => acc + links.length, 0);
  const links = rewrites.reduce((acc, { links }) => acc + links.join('\n'), '');
  
  await rest.post(`/channels/${message.channel_id}/messages`, {
    body: {
      content: `Fixed ${total} link${total === 1 ? '' : 's'}:\n${links}`,
      allowed_mentions: { parse: [] }
    }
  });
});

manager.connect().then(() => console.log('[manager]: ready'));