'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { usePostHog } from 'posthog-js/react';
import { pricingPlans, PricingPlan } from '@/constants/pricing';
import { productSchema } from '@/constants/structured-json';
import { useState } from 'react';
import { Switch } from '../ui/switch';

type PricingCardProps = {
  card: PricingPlan;
  billingCycle: 'monthly' | 'yearly';
};

const PricingCardItem = (props: PricingCardProps) => {
  const { card, billingCycle } = props;
  const posthog = usePostHog();

  const handleCtaClick = () => {
    posthog.capture('pricing_card_cta_clicked', {
      card: card.title,
      buttonText: card.buttonText,
      buttonLink: card.buttonLink,
      price: card.price,
    });
    if (card.onClick) card.onClick();
  };

  const currentPlan = billingCycle === 'monthly' ? card.monthly : card.yearly;
  const displayPrice = currentPlan?.discountedPrice ?? currentPlan?.price ?? card.price;
  const originalPrice = currentPlan?.price;
  const priceDetail = currentPlan?.priceDetail;

  return (
    <Card className="bg-card border-border rounded-lg overflow-hidden relative flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-card-foreground">{card.title}</h3>
          {card.isRecommended && (
            <div className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground dark:text-card">
              RECOMMENDED
            </div>
          )}
        </div>

        <div className="mt-4 text-4xl font-bold">
          {card.isDiscounted && originalPrice && displayPrice !== originalPrice ? (
            <>
              <span className="line-through text-muted-foreground text-sm">{originalPrice}</span>
              <span className="ml-1 text-accent">{displayPrice}</span>
            </>
          ) : (
            <span>{displayPrice}</span>
          )}
          {priceDetail && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{priceDetail}</span>
          )}
        </div>
        {card.highlightText && (
          <p className="text-sm text-accent font-medium mt-2">{card.highlightText}</p>
        )}
      </CardHeader>
      <CardContent className="mt-2 flex-grow">
        <p className="text-muted-foreground mb-6">{card.description}</p>
        <ul className="space-y-2 text-muted-foreground">
          {card.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle2
                className={`h-4 w-4 mr-2 ${feature.isPrimary ? 'text-muted-foreground' : 'text-gray-200'}`}
              />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        {card.buttonLink ? (
          <Button
            id={card.buttonId}
            variant={card.buttonVariant}
            className="w-full focus:outline-0 focus:shadow-[0_0_2px_4px] focus:shadow-primary/15"
            asChild
            disabled={card.disabled}
            onClick={handleCtaClick}
          >
            {card.buttonLink.startsWith('mailto:') ? (
              <a href={card.buttonLink}>{card.buttonText}</a>
            ) : card.buttonLink.startsWith('/') ? (
              <Link href={card.buttonLink}>{card.buttonText}</Link>
            ) : (
              <a href={card.buttonLink} target="_blank" rel="noopener noreferrer">
                {card.buttonText}
              </a>
            )}
          </Button>
        ) : (
          <Button
            id={card.buttonId}
            variant={card.buttonVariant}
            className="w-full focus:outline-0 focus:shadow-[0_0_2px_4px] focus:shadow-primary/15"
            disabled={card.disabled}
            onClick={handleCtaClick}
          >
            {card.buttonText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

type PricingCardsProps = {
  billingCycle: 'monthly' | 'yearly';
};

export const PricingCards = (props: PricingCardsProps) => {
  const { billingCycle } = props;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
      {pricingPlans.map((card, index) => (
        <PricingCardItem key={index} card={card} billingCycle={billingCycle} />
      ))}
    </div>
  );
};

export const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="bg-background scroll-mt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            Pricing Plans
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that&apos;s right for you and your team
          </p>
          <div className="flex items-center justify-center mt-8 space-x-4">
            <span>Monthly</span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span>Yearly</span>
          </div>
        </div>

        <PricingCards billingCycle={billingCycle} />

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for a self-hosted option? Check out our docs on{' '}
            <Link href={routes.docs.selfHosting} className="text-primary hover:underline">
              self hosting
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
};
