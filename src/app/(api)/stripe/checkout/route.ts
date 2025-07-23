import { COUPON_CODES, STRIPE_PRICE_IDS } from '@/constants/pricing';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const handler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationUuid = searchParams.get('organizationUuid');
  const stripePriceId = searchParams.get('stripePriceId');
  const seats = searchParams.get('seats');

  const supabase = await createClient();
  const { services, logger } = new AgentsmithServices({ supabase });

  if (!organizationUuid || !stripePriceId) {
    logger.error('Missing organizationUuid or stripePriceId, cannot create stripe checkout');

    return NextResponse.redirect(
      new URL(
        routes.error('Missing organizationUuid or stripePriceId, cannot create stripe checkout'),
        req.url,
      ),
    );
  }

  const { authUser, agentsmithUser } = await services.users.initialize();

  if (!authUser || !agentsmithUser) {
    logger.error('User not found, cannot create stripe checkout.');
    return NextResponse.redirect(
      new URL(routes.error('User not found, cannot create stripe checkout.'), req.url),
    );
  }

  const organization = await services.organizations.getOrganizationData(organizationUuid);

  if (!organization) {
    return NextResponse.redirect(
      new URL(routes.error('Organization not found, cannot create stripe checkout.'), req.url),
    );
  }

  // validate the price id
  try {
    await stripe.prices.retrieve(stripePriceId);
  } catch (error) {
    logger.error(error, 'Error retrieving price, cannot create stripe checkout.');
    return NextResponse.redirect(
      new URL(routes.error('Invalid price id, cannot create stripe checkout.'), req.url),
    );
  }

  const successUrl = new URL(routes.studio.organizationBillingSuccess(organizationUuid), req.url);

  // should get this from url params via a pricing modal or something so it's more clear
  // quantity == number of seats
  const maxQuantity =
    stripePriceId === STRIPE_PRICE_IDS.HOBBY.MONTHLY ||
    stripePriceId === STRIPE_PRICE_IDS.HOBBY.YEARLY
      ? 3
      : 99;

  const metadata = {
    organizationUuid,
    agentsmithUserId: agentsmithUser.id,
    authUserId: authUser.id,
  };

  const quantity = seats !== null && !isNaN(Number(seats)) ? Number(seats) : 1;

  try {
    const session = await stripe.checkout.sessions.create({
      success_url: successUrl.toString(),
      line_items: [
        {
          price: stripePriceId,
          quantity,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: maxQuantity,
          },
        },
      ],
      mode: 'subscription',
      discounts: [{ coupon: COUPON_CODES.AGENTSMITH50 }],
      customer_email: organization.stripe_customer_id ? undefined : authUser.email,
      customer: organization.stripe_customer_id ?? undefined,
      metadata,
      subscription_data: {
        metadata,
      },
    });

    if (!session.url) {
      logger.error(
        session,
        'Stripe checkout session url not found, cannot create stripe checkout.',
      );
      return NextResponse.redirect(
        new URL(
          routes.error('Stripe checkout session url not found, cannot create stripe checkout.'),
          req.url,
        ),
      );
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    logger.error(error, 'Error creating stripe checkout session, cannot create stripe checkout.');
    return NextResponse.redirect(
      new URL(
        routes.error('Error creating stripe checkout session, cannot create stripe checkout.'),
        req.url,
      ),
    );
  }
};

export { handler as GET };
