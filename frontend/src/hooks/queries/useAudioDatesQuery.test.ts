import { describe, it, expect, vi, afterEach } from 'vitest';
import { AUDIO_DATES_URL, fetchAudioDates } from './useAudioDatesQuery';

/*
 * The manifest decides whether a poem is shown as having a recording, and the
 * consumers look it up by exact string. A payload that parses but does not hold
 * YYYYMMDD would match nothing and silently un-highlight the whole archive, so
 * these tests are about the shape being enforced rather than merely parsed.
 */
describe('fetchAudioDates', () => {
  const ok = (json: unknown) =>
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(json),
    } as unknown as Response);

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds a set from the manifest', async () => {
    vi.stubGlobal('fetch', ok(['20150325', '20150327']));

    const dates = await fetchAudioDates();

    expect(dates.has('20150325')).toBe(true);
    expect(dates.has('20150326')).toBe(false);
  });

  it('requests the asset from the app origin and forwards the abort signal', async () => {
    const stub = ok(['20150325']);
    vi.stubGlobal('fetch', stub);
    const controller = new AbortController();

    await fetchAudioDates(controller.signal);

    expect(stub).toHaveBeenCalledWith(AUDIO_DATES_URL, { signal: controller.signal });
  });

  it('throws when the manifest is missing rather than resolving to an empty set', async () => {
    // An empty set reports that nothing in the archive has audio, which is a
    // silent, total regression. The caller can only degrade sensibly if it
    // knows the fetch failed.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));

    await expect(fetchAudioDates()).rejects.toThrow('404');
  });

  it('rejects a payload that is not an array', async () => {
    vi.stubGlobal('fetch', ok({ dates: ['20150325'] }));

    await expect(fetchAudioDates()).rejects.toThrow('malformed');
  });

  it('rejects ISO dates, which would look valid and match nothing', async () => {
    vi.stubGlobal('fetch', ok(['2015-03-25']));

    await expect(fetchAudioDates()).rejects.toThrow('malformed');
  });

  it('rejects numbers, which JSON allows and the lookup would miss', async () => {
    vi.stubGlobal('fetch', ok([20150325]));

    await expect(fetchAudioDates()).rejects.toThrow('malformed');
  });

  it('rejects a short date rather than accepting any string', async () => {
    vi.stubGlobal('fetch', ok(['201503']));

    await expect(fetchAudioDates()).rejects.toThrow('malformed');
  });
});
