'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { usePostHog } from 'posthog-js/react';

type PricingCardFeature = {
  text: string;
  isPrimary?: boolean;
};

type PricingCardData = {
  title: string;
  price: string;
  discountedPrice?: string;
  priceDetail?: string;
  description: string;
  features: PricingCardFeature[];
  buttonText: string;
  buttonLink?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | null | undefined;
  isRecommended?: boolean;
  isDiscounted?: boolean;
  highlightText?: string;
  disabled?: boolean;
  onClick?: () => void;
  buttonId?: string;
};

const handleJoinWaitlistClick = () => {
  const $emailInput = document.getElementById('EMAIL');
  if ($emailInput) {
    setTimeout(() => {
      $emailInput.focus();
    }, 1);
  }
};

const pricingData: PricingCardData[] = [
  {
    title: 'Cloud Free',
    price: 'Coming Soon',
    description:
      "The hosted AgentSmith app, live and free. Join our mailing list to be notified when it's ready.",
    features: [
      { text: 'Limited prompt creation' },
      { text: 'Basic testing tools' },
      { text: 'Community support' },
    ],
    buttonText: 'Join Waitlist',
    buttonVariant: 'outline',
    disabled: false,
    buttonLink: '/#join-waitlist',
    onClick: handleJoinWaitlistClick,
  },
  {
    title: 'Pro',
    price: '$599',
    priceDetail: '/year',
    description:
      'Perfect for individual developers and small teams. Pay now to get immediate Alpha access!',
    features: [
      { text: 'Unlimited prompt creation', isPrimary: true },
      { text: 'Advanced testing tools', isPrimary: true },
      { text: 'GitHub integration', isPrimary: true },
      { text: 'Typesafe SDK access', isPrimary: true },
      { text: 'Priority support', isPrimary: true },
    ],
    buttonText: 'Join Alpha Club',
    buttonLink: routes.external.stripe.checkout.proAlphaClub,
    isRecommended: true,
    isDiscounted: true,
    discountedPrice: '$299',
    highlightText: 'Pay now to receive early access. Join the alpha club! (limited to 100 spots)',
    buttonId: 'join-alpha-club',
  },
  {
    title: 'Enterprise',
    price: 'Custom',
    description: 'Tailored solutions for large organizations with specific needs.',
    features: [
      { text: 'Dedicated support', isPrimary: true },
      { text: 'Custom integrations', isPrimary: true },
      { text: 'Single Sign-On (SSO)', isPrimary: true },
      { text: 'Service Level Agreements (SLA)', isPrimary: true },
      { text: 'Volume discounts', isPrimary: true },
    ],
    buttonText: 'Contact Us',
    buttonLink: `mailto:${routes.emails.enterprise}`,
    buttonVariant: 'default',
  },
];

type PricingCardProps = {
  card: PricingCardData;
};

const PricingCardItem = (props: PricingCardProps) => {
  const { card } = props;
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

  return (
    <Card className="bg-card border-border rounded-lg overflow-hidden relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-card-foreground">{card.title}</h3>
          {card.isRecommended && (
            <div className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              RECOMMENDED
            </div>
          )}
        </div>

        <div className="mt-4 text-4xl font-bold">
          {card.isDiscounted ? (
            <>
              <span className="line-through text-muted-foreground text-sm">{card.price}</span>
              <span className="ml-1 text-primary">{card.discountedPrice}</span>
            </>
          ) : (
            <span>{card.price}</span>
          )}
          {card.priceDetail && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {card.priceDetail}
            </span>
          )}
        </div>
        {card.highlightText && (
          <p className="text-sm text-primary font-medium mt-2">{card.highlightText}</p>
        )}
      </CardHeader>
      <CardContent className="mt-2">
        <p className="text-muted-foreground mb-6">{card.description}</p>
        <ul className="space-y-2 text-muted-foreground">
          {card.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle2
                className={`h-4 w-4 mr-2 ${feature.isPrimary ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
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

export const PricingCards = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {pricingData.map((card, index) => (
        <PricingCardItem key={index} card={card} />
      ))}
    </div>
  );
};

export const PricingSection = () => {
  return (
    <section id="pricing" className="bg-background scroll-mt-40">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            Pricing Plans
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that&apos;s right for you and your team
          </p>
        </div>

        <PricingCards />

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Looking for a self-hosted option? Check out our{' '}
            <a
              href={routes.external.github}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              free Community Edition on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};
