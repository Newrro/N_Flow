import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    let url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      url = 'file:payroll.db';
    }

    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return client;
}
