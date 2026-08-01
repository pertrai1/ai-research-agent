import { createMemoryHooks } from '@cadmusgroup-llc/cg-agent-flow-memory';
import type { MemoryEntry } from '@cadmusgroup-llc/cg-agent-flow-memory';
import type { Message } from '@cadmusgroup-llc/cg-agent-flow-llm';
import { describe, expect, it } from 'vitest';

import { LocalMemoryStore, createConversationMemory } from '../src/memory.js';

const message = (content: string): Message => ({ role: 'user', content });

describe('conversation memory', () => {
  it('uses a YAML-compatible sliding window with a default of 50 messages', async () => {
    const store = new LocalMemoryStore();
    const memory = createConversationMemory(store);

    await memory.addMessages(
      'session-a',
      Array.from({ length: 51 }, (_, index) => message(`message-${index + 1}`)),
    );

    const history = await memory.getHistory('session-a');
    expect(history).toHaveLength(50);
    expect(history.at(0)?.message.content).toBe('message-2');
    expect(history.at(-1)?.message.content).toBe('message-51');
  });

  it('honors a configured message window', async () => {
    const store = new LocalMemoryStore();
    const memory = createConversationMemory(store, 2);

    await memory.addMessages('session-a', [
      message('one'),
      message('two'),
      message('three'),
    ]);

    expect(
      (await memory.getHistory('session-a')).map(
        (entry) => entry.message.content,
      ),
    ).toEqual(['two', 'three']);
  });

  it('isolates sessions and makes a new store empty after restart', async () => {
    const store = new LocalMemoryStore();
    const memory = createConversationMemory(store);
    await memory.addMessages('session-a', [message('private-a')]);
    await memory.addMessages('session-b', [message('private-b')]);

    expect(
      (await memory.getHistory('session-a')).map(
        (entry) => entry.message.content,
      ),
    ).toEqual(['private-a']);
    expect(
      (await memory.getHistory('session-b')).map(
        (entry) => entry.message.content,
      ),
    ).toEqual(['private-b']);

    expect(
      await createConversationMemory(new LocalMemoryStore()).getHistory(
        'session-a',
      ),
    ).toEqual([]);
  });

  it('loads same-session context through lifecycle hooks', async () => {
    const memory = createConversationMemory(new LocalMemoryStore());
    const hooks = createMemoryHooks(memory);
    const beforeRun = hooks.beforeRun;
    const afterRun = hooks.afterRun;
    if (!beforeRun || !afterRun) throw new Error('memory hooks are incomplete');

    const firstContext = await beforeRun({
      agentName: 'research-agent',
      prompt: 'first',
      context: { sessionId: 'session-a' },
      timestamp: Date.now(),
    });
    await afterRun({
      agentName: 'research-agent',
      prompt: 'first',
      result: { success: true, answer: 'answer' },
      duration: 1,
      timestamp: Date.now(),
    });

    const followUp = await beforeRun({
      agentName: 'research-agent',
      prompt: 'follow-up',
      context: { sessionId: 'session-a' },
      timestamp: Date.now(),
    });

    expect(firstContext?.context?.sessionId).toBe('session-a');
    expect(followUp?.context?.conversationHistory).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'answer' },
    ]);
  });
});

describe('LocalMemoryStore', () => {
  it('stores validated entries by exact key', async () => {
    const store = new LocalMemoryStore();
    const entry: MemoryEntry = {
      key: 'key',
      value: 'value',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    };

    await store.set('key', entry);
    expect(await store.get('key')).toEqual(entry);
    expect(await store.has('key')).toBe(true);
  });
});
