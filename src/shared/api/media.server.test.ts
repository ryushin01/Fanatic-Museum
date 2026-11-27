import { afterEach, describe, expect, it, vi } from 'vitest';

import { usesLocalMedia } from './media.server';

const readFile = vi.hoisted(() => vi.fn<(path: string, encoding: string) => Promise<string>>());
vi.mock('node:fs/promises', () => ({ readFile }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  readFile.mockReset();
});

describe('usesLocalMedia', () => {
  it('보관함이 있는 컴퓨터의 일반 빌드는 로컬 이미지를 쓴다', () => {
    expect(usesLocalMedia({})).toBe(true);
  });

  it('CI·배포 빌드는 이미지 폴더를 지우므로 로컬 이미지를 쓰지 않는다', () => {
    expect(usesLocalMedia({ CI: 'true' })).toBe(false);
    expect(usesLocalMedia({ VERCEL: '1' })).toBe(false);
  });
});

describe('loadMediaIndex', () => {
  it('로컬 빌드는 public/media/index.json을 한 번만 읽어 돌려준다', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('VERCEL', '');
    readFile.mockResolvedValue(JSON.stringify({ saekano: [{ key: 'a' }] }));
    const { loadMediaIndex } = await import('./media.server');
    await expect(loadMediaIndex()).resolves.toEqual({ saekano: [{ key: 'a' }] });
    await loadMediaIndex();
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0]?.[0]).toMatch(/public[\\/]media[\\/]index\.json$/);
  });

  it('목록이 없으면(보관함 없는 컴퓨터) 빈 목록으로 자리 표시 그래픽을 쓰게 한다', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('VERCEL', '');
    readFile.mockRejectedValue(new Error('ENOENT'));
    const { loadMediaIndex } = await import('./media.server');
    await expect(loadMediaIndex()).resolves.toEqual({});
  });

  it('CI 빌드는 파일을 읽지 않고 빈 목록을 돌려준다', async () => {
    vi.stubEnv('CI', 'true');
    const { loadMediaIndex } = await import('./media.server');
    await expect(loadMediaIndex()).resolves.toEqual({});
    expect(readFile).not.toHaveBeenCalled();
  });
});
