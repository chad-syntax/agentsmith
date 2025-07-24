/// <reference lib="deno.ns" />

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { Buffer } from 'node:buffer';
import { StripeSync } from 'npm:@supabase/stripe-sync-engine@0.39.0';
import { agentsmithProcessWebhook } from './lib/process-webhook.ts';

// Load secrets from environment variables
const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

// Initialize StripeSync
const stripeSync = new StripeSync({
  databaseUrl,
  stripeWebhookSecret,
  stripeSecretKey,
  backfillRelatedEntities: false,
  autoExpandLists: true,
});

Deno.serve(async (req) => {
  // Extract raw body as Uint8Array (buffer)
  const rawBody = new Uint8Array(await req.arrayBuffer()) as Buffer<ArrayBufferLike>;

  const stripeSignature = req.headers.get('stripe-signature');

  if (!stripeSignature) {
    return new Response(null, {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await stripeSync.processWebhook(rawBody, stripeSignature);
    console.log('Stripe sync engine processed webhook');
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unhandled webhook event')) {
      console.log('Unhandled webhook event, skipping sync');
    } else {
      console.error(error);
      console.error('Stripe sync engine failed to process webhook');
    }
  }

  try {
    await agentsmithProcessWebhook(rawBody, stripeSignature);
  } catch (error) {
    console.error(error);
    console.error('Agentsmith failed to process webhook');
  }

  return new Response(null, {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
});
