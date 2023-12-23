import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import { PresenceUpdateStatus, ActivityType, GatewayIntentBits, GatewayDispatchEvents } from 'discord-api-types/v10';

import { httpServer } from "./api";
import { onMessageCreate } from "./events/messageCreate";
import { onMessageUpdate } from "./events/messageUpdate";
import { rest } from "./rest";

import { onGuildCreate, onGuildDelete, onGuildUpdate } from "./cache/guilds";
import { onChannelCreate, onChannelDelete, onChannelUpdate } from "./cache/channel";
import { onRoleCreate, onRoleDelete, onRoleUpdate } from "./cache/roles";
import { onMemberAdd, onMemberRemove, onMemberUpdate } from "./cache/members";

const manager = new WebSocketManager({
  token: process.env.DISCORD_BOT_TOKEN!,
  intents: GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent | GatewayIntentBits.Guilds,
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

GatewayDispatchEvents

/**
 * Checks for a `MESSAGE_CREATE` event, and runs the matchers on it
 * if it is such. Ignores all other events.
 */
manager.on(WebSocketShardEvents.Dispatch, async ({ data }) => {
  console.log(data.t);
  switch (data.t) {
    case 'GUILD_CREATE':
      onGuildCreate(data.d);
      break;
    case 'GUILD_UPDATE':
      onGuildUpdate(data.d);
      break;
    case 'GUILD_DELETE':
      onGuildDelete(data.d);
      break;

    case 'CHANNEL_CREATE':
      onChannelCreate(data.d);
      break;
    case 'CHANNEL_UPDATE':
      onChannelUpdate(data.d);
      break;
    case 'CHANNEL_DELETE':
      onChannelDelete(data.d);
      break;

    case 'GUILD_ROLE_CREATE':
      onRoleCreate(data.d);
      break;
    case 'GUILD_ROLE_UPDATE':
      onRoleUpdate(data.d);
      break;
    case 'GUILD_ROLE_DELETE':
      onRoleDelete(data.d);
      break;

    case 'GUILD_MEMBER_ADD':
      onMemberAdd(data.d);
      break;
    case 'GUILD_MEMBER_UPDATE':
      onMemberUpdate(data.d);
      break;
    case 'GUILD_MEMBER_REMOVE':
      onMemberRemove(data.d);
      break;

    case 'MESSAGE_CREATE':
      await onMessageCreate(data.d);
      break
    case 'MESSAGE_UPDATE':
      await onMessageUpdate(data.d);
      break;
    
    default:
      break;
  }
});

manager.connect().then(() => console.log('[manager]: ready'));