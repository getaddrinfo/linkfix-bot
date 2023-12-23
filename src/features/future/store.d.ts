export interface FutureLinks {
  parentId: string;
  tiktok: { [originalUrl: string]: string };
}

export interface FutureStore {
  set(channelId: string, links: FutureLinks): Promise<void>;
  get(channelId: string): Promise<FutureLinks | null>;  
}