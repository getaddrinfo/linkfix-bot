import { hasPermissionInChannel } from "./cache/accessors";
import { CustomPermissionsRepr } from "./cache/permissions";
import { Guild } from "./db/schema";
import { rest } from "./rest";
import { cleanup, willEdit } from "./stores";

interface Context {
  guildId: string;
  channelId: string;
  parentId: string;
  features: Guild['features'];
}

interface Extra {
  willBeEdited: boolean;
}

export const edit = async (
  forMessageId: string,
  links: string[],
  { guildId, channelId }: Pick<Context, 'guildId' | 'channelId'>
) => {
  if (!hasPermissionInChannel(guildId, channelId, CustomPermissionsRepr.CreateMessages)) {
    return;
  }

  // this is a bodge due to the way networking works - we
  // may receive the `MESSAGE_UPDATE` before we have received
  // a response for our `POST /channels/{id}/messages` (post message)
  //
  // To alleviate this, if we don't have it in the cache, we spin
  // 100 times (over 10_000 milliseconds) to try and get the data
  // needed to edit. Otherwise, we just post a new message.
  let originalMessage = await willEdit.get(forMessageId);
  if (!originalMessage) {
    for (let i = 0; i < 100; i++) {
      if (originalMessage) break;

      await new Promise((resolve) => setTimeout(resolve, 100));
      originalMessage = await willEdit.get(forMessageId);
    }
  }

  if (!originalMessage) {
    await send(
      links,
      { 
        guildId, 
        channelId, 
        // in this case, this is fine - parentId is only used if `cleanupParentMessage` is true
        parentId: '', 
        // augment the features so it just sends the links that we couldn't edit into the message
        features: {
          cleanupParentMessage: false,
          onlySendLinks: true,
          waitForValidEmbed: false
        } 
      },
    );
    return;
  };

  let message = `${originalMessage.content}\n${links.join('\n')}`;

  await rest.patch(`/channels/${channelId}/messages/${originalMessage.replyId}`, {
    body: {
      content: message
    }
  });
}

export const send = async (
  links: string[],
  { guildId, channelId, parentId, features }: Context, 
  { willBeEdited }: Extra = { willBeEdited: false }
) => {
  if (!hasPermissionInChannel(guildId, channelId, CustomPermissionsRepr.CreateMessages)) {
    return;
  }

  if (willBeEdited) {
    await willEdit.mark(parentId);
  }

  let content = links.join('\n');
  
  if (!features.onlySendLinks) {
    content = `Fixed ${links.length} link${links.length === 0 ? '' : 's'}:\n${content}`;
  }

  const result = await rest.post(`/channels/${channelId}/messages`, {
    body: {
      content,
      allowed_mentions: { parse: [] }
    }
  });

  const id = (result as any).id;

  if (willBeEdited) {
    await willEdit.set(parentId, {
      content,
      replyId: id
    });
  }

  if (features.cleanupParentMessage) {
    await cleanup.set(id, parentId);
  }
}