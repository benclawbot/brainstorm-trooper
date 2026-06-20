import { describe, expect, it, vi } from 'vitest';
import { MiniMaxService } from './minimaxService';

const response = (content: string, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Unauthorized',
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  } as Response);

describe('MiniMaxService', () => {
  it('uses the BrainstormFlow MiniMax M3 endpoint and authentication contract', async () => {
    const fetchMock = vi.fn(() => response('{"title":"Plan","content":"Steps","tags":["idea"]}'));
    const service = new MiniMaxService('test-key', fetchMock);

    await service.expandIdea('Build a lunar garden', 'en');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.minimax.io/v1/chat/completions');
    expect(init?.headers).toEqual({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'MiniMax-M3',
      thinking: { type: 'disabled' },
    });
  });

  it('parses structured idea and mind-map responses', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        response('```json\n{"title":"Plan","content":"Steps","tags":["idea"]}\n```'),
      )
      .mockImplementationOnce(() =>
        response(
          '<think>private reasoning</think>{"id":"root","text":"Garden","children":[{"id":"a","text":"Light","children":[]}]}',
        ),
      );
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.expandIdea('Garden', 'en')).resolves.toEqual({
      title: 'Plan',
      content: 'Steps',
      tags: ['idea'],
    });
    await expect(service.generateDeepMindMap('Garden', 'en')).resolves.toEqual({
      id: 'root',
      text: 'Garden',
      children: [{ id: 'a', text: 'Light', children: [] }],
    });
  });

  it('supports branches, research, visual concepts, and workspace chat through M3', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response('["Audience","Risks","Timeline"]'))
      .mockImplementationOnce(() => response('## Findings\nA concise dossier.'))
      .mockImplementationOnce(() => response('A cobalt greenhouse orbiting the Moon.'))
      .mockImplementationOnce(() => response('Start with the audience and constraint.'));
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.suggestSubBranches('Garden', ['Moon'], 'en')).resolves.toEqual([
      'Audience',
      'Risks',
      'Timeline',
    ]);
    await expect(service.researchIdea('Garden', 'en')).resolves.toEqual({
      text: '## Findings\nA concise dossier.',
      links: [],
    });
    await expect(service.generateVisual('Garden')).resolves.toMatch(
      /^data:image\/svg\+xml;charset=utf-8,/,
    );
    await expect(service.chatWithWorkspace('What next?', [], [])).resolves.toBe(
      'Start with the audience and constraint.',
    );
  });

  it('reports missing credentials and provider failures clearly', async () => {
    const missingKey = new MiniMaxService('', vi.fn());
    await expect(missingKey.expandIdea('test', 'en')).rejects.toThrow('MINIMAX_API_KEY');

    const rejected = new MiniMaxService(
      'test-key',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: { message: 'Invalid API key' } }),
        } as Response),
      ),
    );
    await expect(rejected.expandIdea('test', 'en')).rejects.toThrow(
      'MiniMax request failed (401): Invalid API key',
    );
  });

  it('binds browser fetch to globalThis instead of the service instance', async () => {
    const browserLikeFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError('Illegal invocation');
      }
      return response('{"title":"Plan","content":"Steps","tags":[]}');
    });
    const service = new MiniMaxService('test-key', browserLikeFetch);

    await expect(service.expandIdea('test', 'en')).resolves.toMatchObject({
      title: 'Plan',
    });
  });

  it('repairs malformed structured output with one additional M3 request', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => response('{"title":"Plan","content":"Steps","tags":["idea"'))
      .mockImplementationOnce(() =>
        response('{"title":"Plan","content":"Steps","tags":["idea"]}'),
      );
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.expandIdea('test', 'en')).resolves.toEqual({
      title: 'Plan',
      content: 'Steps',
      tags: ['idea'],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
