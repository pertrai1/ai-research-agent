import {
  ConversationMemory,
  type MemoryEntry,
  type MemoryStore,
} from '@cadmusgroup-llc/cg-agent-flow-memory';
import { memoryEntrySchema } from '@cadmusgroup-llc/cg-agent-flow-memory';

export const DEFAULT_MEMORY_MAX_MESSAGES = 50;

/** A process-local, exact-key store suitable for the initial single-instance service. */
export class LocalMemoryStore implements MemoryStore {
  private readonly entries = new Map<string, MemoryEntry>();

  async get(key: string): Promise<MemoryEntry | undefined> {
    return this.entries.get(key);
  }

  async set(key: string, entry: MemoryEntry): Promise<void> {
    const parsed = memoryEntrySchema.parse(entry);
    if (parsed.key !== key)
      throw new Error('Memory key does not match entry key.');
    this.entries.set(key, parsed);
  }

  async delete(key: string): Promise<boolean> {
    return this.entries.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.entries.has(key);
  }

  async clear(scope?: string): Promise<void> {
    if (scope === undefined) {
      this.entries.clear();
      return;
    }
    for (const key of this.entries.keys()) {
      if (key.startsWith(scope)) this.entries.delete(key);
    }
  }

  async query(filter: Record<string, unknown>): Promise<MemoryEntry[]> {
    return [...this.entries.values()].filter((entry) =>
      Object.entries(filter).every(
        ([key, value]) => entry.metadata[key] === value,
      ),
    );
  }
}

export function createConversationMemory(
  store: MemoryStore = new LocalMemoryStore(),
  maxMessages: number = DEFAULT_MEMORY_MAX_MESSAGES,
): ConversationMemory {
  return new ConversationMemory(
    { strategy: 'sliding-window', maxMessages },
    store,
    'research-agent',
  );
}
