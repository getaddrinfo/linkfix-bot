import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import { PresenceUpdateStatus, ActivityType } from 'discord-api-types/v10';

import { httpServer } from "./api";
import { onMessageCreate } from "./events/messageCreate";
import { onMessageUpdate } from "./events/messageUpdate";
import { rest } from "./rest";

const manager = new WebSocketManager({
  token: process.env.DISCORD_BOT_TOKEN!,
  intents: 1 << 9 | 1 << 15, // guild messages + message content
  rest,
  initialPresence: {
    activities: [{
      type: ActivityType.Custom,
      name: 'Custom Status',
      state: "Fixing links"
    }],
    afk: false,
    since: 0,
    status: PresenceUpdateStatus.Online
  }
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
  switch (data.t) {
    case 'MESSAGE_CREATE':
      onMessageCreate(data.d);
      break
    case 'MESSAGE_UPDATE':
      onMessageUpdate(data.d);
      break;
    
    default:
      break;
  }
});

manager.connect().then(() => console.log('[manager]: ready'));