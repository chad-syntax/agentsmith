'use client';

import { useEffect } from 'react';
import Script from 'next/script';
// No specific CSS import needed if we are using Tailwind for the new design
import './brevo-email-subscribe.css';

// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Card structure will be removed
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

declare global {
  interface Window {
    REQUIRED_CODE_ERROR_MESSAGE: string;
    LOCALE: string;
    EMAIL_INVALID_MESSAGE: string;
    SMS_INVALID_MESSAGE: string;
    REQUIRED_ERROR_MESSAGE: string;
    GENERIC_INVALID_MESSAGE: string;
    AUTOHIDE: boolean;
    translation: {
      common: {
        selectedList: string;
        selectedLists: string;
        selectedOption: string;
        selectedOptions: string;
      };
    };
    gtag: (...args: any[]) => void; // Added gtag declaration for Google Analytics
    turnstile: any; // Added turnstile declaration
    grecaptcha: any; // Added grecaptcha declaration
  }
}

const AGENTSMITH_INITIAL_LANDING_FORM_URL =
  'https://f2fdd414.sibforms.com/serve/MUIFAEGos-HRtDNOL4V5kjqhVzi-x4e3vFbXmdHRg2a2KaARHm07HdY31ZrjyEysQzbtVDCIMm_Ucm9JZIVUELNM7SS5JCP6-NStge3w-_fMnNwJ6kT4T7N0g-owW5r3APlQFZdQXGOnOryVZvN9S3N_trQkYgDrSjTtvzjd3hZlJ0OTCtz42xF7jE4l_Z1jivQAG16IddGr0sQH';

export const BrevoForms = {
  agentsmithInitialLanding: AGENTSMITH_INITIAL_LANDING_FORM_URL,
} as const;

type BrevoForm = keyof typeof BrevoForms;

type BrevoEmailSubscribeProps = {
  form: BrevoForm;
  trackingLocation: string;
};

export const BrevoEmailSubscribe = (props: BrevoEmailSubscribeProps) => {
  const posthog = usePostHog();

  const { form, trackingLocation } = props;
  const formSubmitUrl = BrevoForms[form];

  useEffect(() => {
    window.REQUIRED_CODE_ERROR_MESSAGE = 'Please choose a country code';
    window.LOCALE = 'en';
    window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE =
      'The information provided is invalid. Please review the field format and try again.';
    window.REQUIRED_ERROR_MESSAGE = 'This field cannot be left blank. ';
    window.GENERIC_INVALID_MESSAGE =
      'The information provided is invalid. Please review the field format and try again.';
    window.translation = {
      common: {
        selectedList: '{quantity} list selected',
        selectedLists: '{quantity} lists selected',
        selectedOption: '{quantity} selected',
        selectedOptions: '{quantity} selected',
      },
    };
    window.AUTOHIDE = Boolean(0);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    posthog.capture('brevo_email_subscribe_submitted', {
      trackingLocation,
    });

    // Google Search-1 campaign conversion tracking
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-16839610676/zqbPCJr38pUaELSi4N0-',
        value: 1.0,
        currency: 'USD',
      });
    }
  };

  return (
    <div id="sib-form-container">
      <div id="brevo-email-subscribe-wrapper" className="w-full max-w-md">
        <div id="error-message" className="mb-4 hidden">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your subscription could not be saved. Please try again.
            </AlertDescription>
          </Alert>
        </div>

        <div id="success-message" className="mb-4 hidden">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Your subscription has been successful.</AlertDescription>
          </Alert>
        </div>

        <form
          id="sib-form"
          method="POST"
          action={formSubmitUrl}
          data-type="subscription"
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Input
              type="text"
              id="EMAIL"
              name="EMAIL"
              placeholder="Enter your email"
              autoComplete="off"
              data-required={true}
              required
              className="w-full h-10 bg-background border-border text-foreground placeholder:text-muted-foreground" // Adjusted styling
            />
            <Button
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium whitespace-nowrap sib-hide-loader-icon-parent"
            >
              <Loader2 className="sib-loader sib-hide-loader-icon h-4 w-4 animate-spin" />
              Join Waitlist
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="OPT_IN"
              name="OPT_IN"
              value="1"
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" // Adjusted styling
            />
            <Label
              htmlFor="OPT_IN"
              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-left text-muted-foreground" // Adjusted styling
            >
              I agree to receive newsletters
            </Label>
          </div>

          <div className="text-[10px] text-muted-foreground">
            <p>
              By submitting this form you agree that the personal data you provided will be
              transferred to Brevo for processing in accordance with Brevo's{' '}
              <a
                href="https://www.brevo.com/en/legal/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer" // Added rel for security
                className="underline hover:text-primary"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div
            className="cf-turnstile g-recaptcha m-0" // Keep class for Brevo script
            data-sitekey={process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY}
            id="sib-captcha" // Keep id for Brevo script
            data-callback="handleCaptchaResponse" // Keep callback for Brevo script
            data-language="en"
          />

          <input
            type="text"
            name="email_address_check"
            defaultValue=""
            className="input--hidden m-0 h-0 block"
          />
          <input type="hidden" name="locale" defaultValue="en" />
        </form>
        {/* Brevo's main script and Cloudflare Turnstile script */}
        <Script src="https://sibforms.com/forms/end-form/build/main.js" strategy="lazyOnload" />
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          async={true}
        />
        <Script
          id="brevo-captcha-handler" // Added id for clarity
          dangerouslySetInnerHTML={{
            __html: `
          function handleCaptchaResponse() {
            var event = new Event('captchaChange');
            document.getElementById('sib-captcha').dispatchEvent(event);
            window.grecaptcha = window.turnstile;
          }
        `,
          }}
        />
      </div>
    </div>
  );
};
