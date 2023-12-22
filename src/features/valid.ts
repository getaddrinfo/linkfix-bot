import { GatewayMessageCreateDispatchData } from "discord-api-types/v10";

const enum WaitingServiceType {
  Tiktok = 0
};

const waiting: Record<string, number> = {};

export const addWaiting = (id: string, { tiktok }: { tiktok: boolean }) => {
  let it = 0;
  if (tiktok) it |= WaitingServiceType.Tiktok;

  waiting[id] = it;
}

export const getWaiting = (id: string) => {
  if (!(id in waiting)) {
    return null;
  }

  const waitingFlags = waiting[id];


  return {
    tiktok: (waitingFlags & WaitingServiceType.Tiktok) === WaitingServiceType.Tiktok
  };
}

export const removeWaiting = (id: string, service: "tiktok") => {
  if (!(id in waiting)) return;

  switch (service) {
    case "tiktok": {
      waiting[id] &= ~WaitingServiceType.Tiktok;

      if (waiting[id] === 0) {
        delete waiting[id];
      }
    }    
  }
}

export const isMessageWithUpdatedEmbed = (data: GatewayMessageCreateDispatchData) => {
  return data.timestamp === "0";
}