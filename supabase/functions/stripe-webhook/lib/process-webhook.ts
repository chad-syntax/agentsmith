import Stripe from 'npm:stripe';
import { Buffer } from 'node:buffer';
import { createClient } from 'npm:@supabase/supabase-js';
import {
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from './event-handlers.ts';

// Load secrets from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const agentsmithProcessWebhook = async (rawBody: Buffer, stripeSignature: string) => {
  const event = await stripe.webhooks.constructEventAsync(
    rawBody,
    stripeSignature,
    stripeWebhookSecret,
  );

  switch (event.type) {
    case 'customer.subscription.created': {
      await handleSubscriptionCreated(supabase, event.data.object);
      break;
    }
    case 'customer.subscription.updated': {
      await handleSubscriptionUpdated(supabase, event.data.object);
      break;
    }
    case 'customer.subscription.deleted': {
      await handleSubscriptionDeleted(supabase, event.data.object);
      break;
    }
    default: {
      console.log(`Agentsmith processor received ${event.type} webhook, skipping sync`);
      break;
    }
  }

  console.log(`Agentsmith stripe webhook processor successfully processed ${event.type} webhook`);
};
