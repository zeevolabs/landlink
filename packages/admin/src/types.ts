export interface ConfigStore {
  get(): Promise<Record<string, unknown> | null>;
  put(config: Record<string, unknown>): Promise<void>;
}
