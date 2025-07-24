import type { SupabaseClient } from 'npm:@supabase/supabase-js';
import type Stripe from 'npm:stripe';

export const handleSubscriptionCreated = async (
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) => {
  let firstLog = `Agentsmith stripe webhook processor received customer.subscription.created webhook`;

  if ('id' in subscription) {
    firstLog += ` with stripe_subscription_id ${subscription.id}`;
  }

  if ('customer' in subscription) {
    firstLog += ` with stripe_customer_id ${subscription.customer}`;
  }

  console.log(firstLog);

  // get the organizationUuid from the metadata
  const organizationUuid = subscription.metadata.organizationUuid;

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

  const productId = subscription.items.data[0].price.product;

  const { data: agentsmithTier, error: agentsmithTierError } = await supabase
    .from('agentsmith_tiers')
    .select('id, tier')
    .eq('stripe_product_id', productId)
    .single();

  if (agentsmithTierError) {
    console.error(agentsmithTierError);
    console.error('Failed to get agentsmith tier record to process subscription created webhook');
    return;
  }

  // update the organization with the stripe subscription id and the stripe customer id
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      agentsmith_tier_id: agentsmithTier.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      stripe_subscription_item_id: subscription.items.data[0].id,
      seat_count: subscription.items.data[0].quantity,
    })
    .eq('uuid', organizationUuid);

  if (updateError) {
    console.error(updateError);
    console.error('Failed to update organization with stripe subscription id and customer id');
    return;
  }

  let finalLog = `Organization ${organizationUuid} updated to tier ${agentsmithTier.tier}`;
  finalLog += ` with stripe_subscription_id ${subscription.id}`;
  finalLog += ` with stripe_customer_id ${subscription.customer}`;
  finalLog += ` with stripe_subscription_item_id ${subscription.items.data[0].id}`;
  finalLog += ` with seat_count ${subscription.items.data[0].quantity}`;

  console.log(finalLog);
};

export const handleSubscriptionUpdated = async (
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) => {
  console.log(`Agentsmith stripe webhook processor received customer.subscription.updated webhook`);

  const organizationUuid = subscription.metadata.organizationUuid;

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
  const updatedProductId = subscription.items.data[0].price.product;
  const updatedSubscriptionItemId = subscription.items.data[0].id;
  const updatedSeatCount = subscription.items.data[0].quantity;

  const { data: agentsmithTier, error: agentsmithTierError } = await supabase
    .from('agentsmith_tiers')
    .select('id, tier')
    .eq('stripe_product_id', updatedProductId)
    .single();

  if (agentsmithTierError) {
    console.error(agentsmithTierError);
    console.error('Failed to get agentsmith tier record to process subscription updated webhook');
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
};

export const handleSubscriptionDeleted = async (
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
) => {
  console.log(`Agentsmith processor received customer.subscription.deleted webhook`);

  const organizationUuid = subscription.metadata.organizationUuid;

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
};
