interface Env {
  RENDER_API_URL: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const url = `${env.RENDER_API_URL}/api/health`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Nova-KeepAlive-Worker/1.0' },
      });

      if (response.ok) {
        const data = (await response.json()) as Record<string, unknown>;
        console.log(`[keep-alive] OK — status: ${data['status']}, uptime: ${data['uptime']}s`);
      } else {
        console.error(`[keep-alive] FAIL — HTTP ${response.status}`);
      }
    } catch (err) {
      console.error(`[keep-alive] ERROR — ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  async fetch(
    _request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = `${env.RENDER_API_URL}/api/health`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Nova-KeepAlive-Worker/1.0' },
      });

      const data = (await response.json()) as Record<string, unknown>;

      return new Response(
        JSON.stringify({
          worker: 'nova-keep-alive',
          target: url,
          targetStatus: response.status,
          targetHealth: data,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          worker: 'nova-keep-alive',
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
