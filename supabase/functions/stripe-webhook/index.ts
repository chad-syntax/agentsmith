/// <reference lib="deno.ns" />

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe';
import { Buffer } from 'node:buffer';
import { StripeSync } from 'npm:@supabase/stripe-sync-engine@0.39.0';
import { createClient } from 'npm:@supabase/supabase-js';

// Load secrets from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const processWebhook = async (rawBody: Buffer, stripeSignature: string) => {
  const event = await stripe.webhooks.constructEventAsync(
    rawBody,
    stripeSignature,
    stripeWebhookSecret,
  );

  switch (event.type) {
    case 'customer.subscription.created': {
      let firstLog = `Agentsmith stripe webhook processor received ${event.type} webhook`;

      if ('id' in event.data.object) {
        firstLog += ` with stripe_subscription_id ${event.data.object.id}`;
      }

      if ('customer' in event.data.object) {
        firstLog += ` with stripe_customer_id ${event.data.object.customer}`;
      }

      console.log(firstLog);

      // get the organizationUuid from the metadata
      const organizationUuid = event.data.object.metadata.organizationUuid;

      if (!organizationUuid) {
        console.warn(
          'Organization uuid not found in metadata to process subscription created webhook, exiting.',
        );
        return;
      }

      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .select('id')
        .eq('uuid', organizationUuid)
        .single();

      if (organizationError) {
        console.error(organizationError);
        console.error('Failed to get organization to process subscription created webhook');
        return;
      }

      if (!organization) {
        console.error('Organization not found to process subscription created webhook');
        return;
      }

      const productId = event.data.object.items.data[0].price.product;

      const { data: agentsmithTier, error: agentsmithTierError } = await supabase
        .from('agentsmith_tiers')
        .select('id, tier')
        .eq('stripe_product_id', productId)
        .single();

      if (agentsmithTierError) {
        console.error(agentsmithTierError);
        console.error(
          'Failed to get agentsmith tier record to process subscription created webhook',
        );
        return;
      }

      // update the organization with the stripe subscription id and the stripe customer id
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          agentsmith_tier_id: agentsmithTier.id,
          stripe_subscription_id: event.data.object.id,
          stripe_customer_id: event.data.object.customer,
          stripe_subscription_item_id: event.data.object.items.data[0].id,
          seat_count: event.data.object.items.data[0].quantity,
        })
        .eq('uuid', organizationUuid);

      if (updateError) {
        console.error(updateError);
        console.error('Failed to update organization with stripe subscription id and customer id');
        return;
      }

      let finalLog = `Organization ${organizationUuid} updated to tier ${agentsmithTier.tier}`;
      finalLog += ` with stripe_subscription_id ${event.data.object.id}`;
      finalLog += ` with stripe_customer_id ${event.data.object.customer}`;
      finalLog += ` with stripe_subscription_item_id ${event.data.object.items.data[0].id}`;
      finalLog += ` with seat_count ${event.data.object.items.data[0].quantity}`;

      console.log(finalLog);
      break;
    }
    case 'customer.subscription.updated': {
      console.log(`Agentsmith stripe webhook processor received ${event.type} webhook`);

      const organizationUuid = event.data.object.metadata.organizationUuid;

      if (!organizationUuid) {
        console.warn(
          'Organization uuid not found in metadata to process subscription updated webhook, exiting.',
        );
        return;
      }

      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .select('id, seat_count, agentsmith_tiers(tier)')
        .eq('uuid', organizationUuid)
        .single();

      if (organizationError) {
        console.error(organizationError);
        console.error('Failed to get organization to process subscription updated webhook');
        return;
      }

      const oldTier = (organization.agentsmith_tiers as unknown as { tier: string }).tier;
      const oldSeatCount = organization.seat_count;
      const updatedProductId = event.data.object.items.data[0].price.product;
      const updatedSubscriptionItemId = event.data.object.items.data[0].id;
      const updatedSeatCount = event.data.object.items.data[0].quantity;

      const { data: agentsmithTier, error: agentsmithTierError } = await supabase
        .from('agentsmith_tiers')
        .select('id, tier')
        .eq('stripe_product_id', updatedProductId)
        .single();

      if (agentsmithTierError) {
        console.error(agentsmithTierError);
        console.error(
          'Failed to get agentsmith tier record to process subscription updated webhook',
        );
        return;
      }

      const newTier = agentsmithTier.tier;

      // update the organization with the new product id and seat count
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          agentsmith_tier_id: agentsmithTier.id,
          stripe_subscription_item_id: updatedSubscriptionItemId,
          seat_count: updatedSeatCount,
        })
        .eq('id', organization.id);

      if (updateError) {
        console.error(updateError);
        console.error('Failed to update organization with new product id and seat count');
        return;
      }

      let finalLog = `Organization ${organizationUuid} updated from tier ${oldTier} to tier ${newTier}`;
      finalLog += ` with stripe_subscription_item_id ${updatedSubscriptionItemId}`;
      finalLog += ` with seat count ${updatedSeatCount} (was ${oldSeatCount})`;

      console.log(finalLog);
      break;
    }
    case 'customer.subscription.deleted': {
      console.log(`Agentsmith processor received ${event.type} webhook`);

      const organizationUuid = event.data.object.metadata.organizationUuid;

      if (!organizationUuid) {
        console.warn(
          'Organization uuid not found in metadata to process subscription deleted webhook, exiting.',
        );
        return;
      }

      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .select('id')
        .eq('uuid', organizationUuid)
        .single();

      if (organizationError) {
        console.error(organizationError);
        console.error('Failed to get organization to process subscription deleted webhook');
        return;
      }

      if (!organization) {
        console.error('Organization not found to process subscription deleted webhook');
        return;
      }

      const { data: freeAgentsmithTier, error: freeAgentsmithTierError } = await supabase
        .from('agentsmith_tiers')
        .select('id')
        .eq('tier', 'FREE')
        .single();

      if (freeAgentsmithTierError) {
        console.error(freeAgentsmithTierError);
        console.error(
          'Failed to get free agentsmith tier record to process subscription deleted webhook',
        );
        return;
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          agentsmith_tier_id: freeAgentsmithTier.id,
          seat_count: 1,
          stripe_subscription_id: null,
          stripe_subscription_item_id: null,
        })
        .eq('uuid', organizationUuid);

      if (updateError) {
        console.error(updateError);
        console.error('Failed to update organization to free tier');
        return;
      }

      console.log(`Organization ${organizationUuid} updated to free tier`);

      break;
    }
    default: {
      console.log(`Agentsmith processor received ${event.type} webhook, skipping sync`);
      break;
    }
  }

  console.log(`Agentsmith stripe webhook processor successfully processed ${event.type} webhook`);
};

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
    await processWebhook(rawBody, stripeSignature);
  } catch (error) {
    console.error(error);
    console.error('Agentsmith failed to process webhook');
  }

  return new Response(null, {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
});
