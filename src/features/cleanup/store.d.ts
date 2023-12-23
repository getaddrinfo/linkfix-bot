export interface CleanupStore {
  set(messageId: string, parentId: string): Promise<void>;
  get(messageId: string): Promise<string | null>; 
}