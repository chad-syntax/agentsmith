import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const handler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationUuid = searchParams.get('organizationUuid');

  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  if (!organizationUuid) {
    logger.error('Missing organizationUuid, cannot create stripe customer portal session.');
    return NextResponse.redirect(
      new URL(
        routes.error('Missing organizationUuid, cannot create stripe customer portal session.'),
        req.url,
      ),
    );
  }

  const { authUser, agentsmithUser } = await services.users.initialize();

  if (!authUser || !agentsmithUser) {
    logger.error('User not found, cannot create stripe customer portal session.');
    return NextResponse.redirect(
      new URL(
        routes.error('User not found, cannot create stripe customer portal session.'),
        req.url,
      ),
    );
  }

  const organizationId = await services.organizations.getOrganizationId(organizationUuid);

  if (!organizationId) {
    logger.error('Organization not found, cannot create stripe customer portal session.');
    return NextResponse.redirect(
      new URL(
        routes.error('Organization not found, cannot create stripe customer portal session.'),
        req.url,
      ),
    );
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', organizationId)
    .single();

  if (error) {
    logger.error(
      error,
      'Error retrieving organization, cannot create stripe customer portal session.',
    );
    return NextResponse.redirect(
      new URL(
        routes.error(
          'Error retrieving organization, cannot create stripe customer portal session.',
        ),
        req.url,
      ),
    );
  }

  if (!data.stripe_customer_id) {
    logger.error(
      'Organization does not have a stripe customer id, cannot create stripe customer portal session.',
    );
    return NextResponse.redirect(
      new URL(
        routes.error(
          'Organization does not have a stripe customer id, cannot create stripe customer portal session.',
        ),
        req.url,
      ),
    );
  }

  const customerPortalUrl = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: new URL(routes.studio.organizationBilling(organizationUuid), req.url).toString(),
  });

  return NextResponse.redirect(customerPortalUrl.url);
};

export { handler as GET };
