declare module "epub2" {
  import { EventEmitter } from "events";

  export interface EpubMetadata {
    title?: string;
    creator?: string;
  }

  export interface EpubFlowItem {
    order?: number;
  }

  export default class EPub extends EventEmitter {
    metadata: EpubMetadata;
    flow: Record<string, EpubFlowItem>;
    constructor(filePath: string);
    parse(): void;
    getChapter(chapterId: string, callback: (err: Error | null, text?: string) => void): void;
  }
}
