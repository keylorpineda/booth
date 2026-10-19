import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ownerApi } from './owner-api';
import { refreshSession } from './session';
import { useSessionStore } from './session-store';

const authResponse = (token: string) => ({
  accessToken: token,
  accessTokenExpiresIn: 900,
  user: { id: 'u1', email: 'ana@example.com', name: 'Ana', isDemo: false },
  store: null,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const urlOf = (input: RequestInfo | URL) =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

const unauthenticated = () =>
  json(401, { error: { code: 'UNAUTHENTICATED', message: 'Sign in required', requestId: 'r' } });

describe('session', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    useSessionStore.setState({ accessToken: null, session: null, status: 'unknown' });
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('shares one refresh request between concurrent callers', async () => {
    fetchMock.mockResolvedValue(json(200, authResponse('new-token')));

    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(results).toEqual([true, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({
      accessToken: 'new-token',
      status: 'signedIn',
    });
  });

  it('signs out when the refresh fails', async () => {
    fetchMock.mockResolvedValue(
      json(401, {
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'No session', requestId: 'r' },
      }),
    );

    expect(await refreshSession()).toBe(false);
    expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', expired: false });
  });

  it('marks the session as expired when a signed-in owner cannot renew it', async () => {
    useSessionStore.getState().signIn(authResponse('old-token'));
    fetchMock.mockResolvedValue(
      json(401, {
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'No session', requestId: 'r' },
      }),
    );

    await refreshSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', expired: true });
  });

  it('retries an owner request once after refreshing an expired token', async () => {
    useSessionStore.setState({ accessToken: 'old-token', status: 'signedIn' });
    fetchMock
      .mockResolvedValueOnce(unauthenticated()) // the request with the old token
      .mockResolvedValueOnce(json(200, authResponse('new-token'))) // refresh
      .mockResolvedValueOnce(json(200, { ok: true })); // retry

    await expect(ownerApi('/me/store')).resolves.toEqual({ ok: true });

    const retry = fetchMock.mock.calls[2]?.[1];
    expect(new Headers(retry?.headers).get('Authorization')).toBe('Bearer new-token');
  });

  it('refreshes once for several requests that expire together', async () => {
    useSessionStore.setState({ accessToken: 'old-token', status: 'signedIn' });
    fetchMock.mockImplementation((url, init) => {
      const target = urlOf(url);
      if (target.endsWith('/auth/refresh'))
        return Promise.resolve(json(200, authResponse('new-token')));
      const auth = new Headers(init?.headers).get('Authorization');
      return Promise.resolve(
        auth === 'Bearer new-token' ? json(200, { ok: true }) : unauthenticated(),
      );
    });

    await Promise.all([ownerApi('/me/orders'), ownerApi('/me/store'), ownerApi('/me/products')]);

    const refreshes = fetchMock.mock.calls.filter(([url]) => urlOf(url).endsWith('/auth/refresh'));
    expect(refreshes).toHaveLength(1);
  });

  it('propagates the error when the refresh also fails', async () => {
    useSessionStore.setState({ accessToken: 'old-token', status: 'signedIn' });
    fetchMock.mockImplementation((url) =>
      Promise.resolve(
        urlOf(url).endsWith('/auth/refresh')
          ? json(401, { error: { code: 'REFRESH_TOKEN_REUSED', message: 'x', requestId: 'r' } })
          : unauthenticated(),
      ),
    );

    await expect(ownerApi('/me/store')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(useSessionStore.getState().status).toBe('signedOut');
  });
});
