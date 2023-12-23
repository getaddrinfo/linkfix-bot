import { GatewayReadyDispatchData } from "discord-api-types/v10";

export let currentUserId: string = "";

export const onReady = (data: GatewayReadyDispatchData) => {
  currentUserId = data.user.id;
}