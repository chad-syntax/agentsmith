import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { hobbyPlan, proPlan, PricingPlan } from '@/constants/pricing';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Switch } from '../ui/switch';
import { CheckCircle2, Loader2, Minus, Plus } from 'lucide-react';
import { routes } from '@/utils/routes';
import { cn } from '@/utils/shadcn';

type UpgradeOrganizationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationUuid: string;
  showHobbyTier?: boolean;
};

type PricingCardProps = {
  card: PricingPlan;
  billingCycle: 'monthly' | 'yearly';
  organizationUuid: string;
};

const PricingCard = (props: PricingCardProps) => {
  const { card, billingCycle, organizationUuid } = props;
  const currentPlan = billingCycle === 'monthly' ? card.monthly : card.yearly;

  const [seats, setSeats] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!currentPlan) {
    return null;
  }

  const displayPrice = currentPlan.discountedPrice ?? currentPlan.price;
  const originalPrice = currentPlan.price;
  const priceDetail = currentPlan.priceDetail;
  const totalPrice = displayPrice * seats;
  const totalOriginalPrice = originalPrice * seats;

  const handleIncrementSeats = () => {
    if (seats < currentPlan.maxSeats) {
      setSeats(seats + 1);
    }
  };

  const handleDecrementSeats = () => {
    if (seats > 1) {
      setSeats(seats - 1);
    }
  };

  const checkoutUrl = routes.external.stripe.checkout(
    organizationUuid,
    currentPlan.stripePriceId,
    seats,
  );

  return (
    <Card className="bg-card border-border rounded-lg flex-1 min-w-0 flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-card-foreground">{card.title}</h3>
          {card.isRecommended && (
            <div className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground dark:text-card">
              RECOMMENDED
            </div>
          )}
        </div>

        <div className="mt-4 text-3xl sm:text-4xl font-bold">
          {card.isDiscounted && totalOriginalPrice !== totalPrice ? (
            <>
              <span className="line-through text-muted-foreground text-sm">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="ml-1 text-accent">${displayPrice.toFixed(2)}</span>
            </>
          ) : (
            <span>${displayPrice.toFixed(2)}</span>
          )}
          {priceDetail && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{priceDetail}</span>
          )}
        </div>

        <div className="mt-2 text-lg font-semibold text-muted-foreground">
          {seats > 1 ? `Total: $${totalPrice.toFixed(2)}` : <>&nbsp;</>}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 space-y-2 sm:space-y-0">
          <span className="text-sm text-muted-foreground">Number of seats:</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrementSeats}
              disabled={seats <= 1}
              className="touch-manipulation"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm">{seats}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrementSeats}
              disabled={seats >= currentPlan.maxSeats}
              className="touch-manipulation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-2 pb-4 flex-grow">
        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm">{card.description}</p>
        <ul className="space-y-2 text-muted-foreground text-sm">
          {card.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle2
                className={`h-4 w-4 mr-2 flex-shrink-0 ${feature.isPrimary ? 'text-muted-foreground' : 'text-gray-200'}`}
              />
              <span className="break-words">{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-4">
        <Button
          onClick={() => setIsLoading(true)}
          variant={card.buttonVariant}
          className="w-full"
          asChild
          disabled={card.disabled}
        >
          {isLoading ? (
            <div>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <a href={checkoutUrl}>Checkout</a>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const UpgradeOrganizationModal = (props: UpgradeOrganizationModalProps) => {
  const { open, onOpenChange, organizationUuid, showHobbyTier = true } = props;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Upgrade Plan</DialogTitle>
          <DialogDescription>Choose the plan that best fits your needs.</DialogDescription>
          <div className="flex items-center justify-center pt-4 space-x-4">
            <span className="text-sm">Monthly</span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className="text-sm">Yearly</span>
          </div>
        </DialogHeader>
        <div
          className={cn(
            'flex flex-col lg:flex-row gap-4 lg:gap-8 justify-center',
            !showHobbyTier && 'lg:max-w-1/2 lg:mx-auto',
          )}
        >
          {showHobbyTier && (
            <PricingCard
              card={hobbyPlan}
              billingCycle={billingCycle}
              organizationUuid={organizationUuid}
            />
          )}
          <PricingCard
            card={proPlan}
            billingCycle={billingCycle}
            organizationUuid={organizationUuid}
          />
        </div>
        <DialogFooter className="pt-4">
          <p className="w-full text-center text-sm text-muted-foreground">
            Interested in higher limits? Become an enterprise customer by emailing{' '}
            <Button variant="link" asChild className="p-0 h-auto text-sm font-normal underline">
              <a href={routes.emails.enterprise}>enterprise@agentsmith.dev</a>
            </Button>
            .
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
