interface WillEditData {
  content: string;
  replyId: string;
}

export interface WillEditStore {
  mark(parentId: string): Promise<void>;
  isMarked(parentId: string): Promise<boolean>;

  set(parentId: string, data: WillEditData): Promise<void>;
  get(parentId: string): Promise<WillEditData | null>;
}