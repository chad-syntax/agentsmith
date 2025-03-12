/**
 * This script is used to proxy webhook requests from the internet to localhost for local development
 */

import SmeeClient from 'smee-client';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SMEE_WEBHOOK_PROXY_URL = process.env.SMEE_WEBHOOK_PROXY_URL;

if (!SMEE_WEBHOOK_PROXY_URL) {
  throw new Error('SMEE_WEBHOOK_PROXY_URL is not defined');
}

const smee = new SmeeClient({
  source: SMEE_WEBHOOK_PROXY_URL,
  target: 'http://localhost:3000/github/webhook',
  logger: console,
});

const events = smee.start();

// Stop forwarding events
// events.close();
