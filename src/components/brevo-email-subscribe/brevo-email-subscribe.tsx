'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import './brevo-email-subscribe.css';
import { usePostHog } from 'posthog-js/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
      };
    };
  }
}

const AGENTSMITH_INITIAL_LANDING_FORM_URL =
  'https://f2fdd414.sibforms.com/serve/MUIFAEfXwaofbSDfuJbYKpt255dwGkOyoJGRbydfUap-LjkURZrTEFj8mNzSST9zNHWZ88Nu0zoPrfakDdSFw-eEEFT0mtuJc0fSReYBQjbDy3Fa4XfsioEtitRVYh-ArolbK7lWiWjd7tbIo9dFvUsX9B7A2QlbRi2CWkDR_rpGSI4n2gL0hmj2B4GEti6Bg0rPGtkk5coyLux8';

export const BrevoForms = {
  agentsmithInitialLanding: AGENTSMITH_INITIAL_LANDING_FORM_URL,
} as const;

type BrevoForm = keyof typeof BrevoForms;

type BrevoEmailSubscribeProps = {
  form: BrevoForm;
};

export const BrevoEmailSubscribe = (props: BrevoEmailSubscribeProps) => {
  const posthog = usePostHog();

  const { form } = props;
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
      },
    };
    window.AUTOHIDE = Boolean(0);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    posthog.capture('brevo_email_subscribe_submitted');

    // Google Search-1 campaign conversion tracking
    window.gtag('event', 'conversion', {
      send_to: 'AW-16839610676/zqbPCJr38pUaELSi4N0-',
      value: 1.0,
      currency: 'USD',
    });
  };

  return (
    <div id="brevo-email-subscribe" className="max-w-[540px] mx-auto">
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

      <Card>
        <form
          id="sib-form"
          method="POST"
          action={formSubmitUrl}
          data-type="subscription"
          onSubmit={handleSubmit}
        >
          <CardHeader>
            <CardTitle className="text-3xl text-left">Be the first in the door</CardTitle>
            <p className="text-muted-foreground text-left mt-2">
              Early subscribers will get access first!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="EMAIL" className="sr-only">
                Email
              </Label>
              <Input
                type="email"
                id="EMAIL"
                name="EMAIL"
                placeholder="Enter your email"
                autoComplete="off"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="OPT_IN" name="OPT_IN" value="1" />
              <Label htmlFor="OPT_IN" className="text-sm leading-none text-muted-foreground">
                I agree to receive your newsletters and accept the data privacy statement.
              </Label>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                We use Brevo as our marketing platform. By submitting this form you agree that the
                personal data you provided will be transferred to Brevo for processing in accordance
                with{' '}
                <a
                  href="https://www.brevo.com/en/legal/privacypolicy/"
                  target="_blank"
                  className="underline hover:text-primary"
                >
                  Brevo's Privacy Policy
                </a>
                .
              </p>
            </div>

            <div
              className="cf-turnstile g-recaptcha"
              data-sitekey={process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY}
              id="sib-captcha"
              data-callback="handleCaptchaResponse"
              data-language="en"
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" size="lg">
              <Loader2 className="mr-2 h-4 w-4 animate-spin sib-hide-loader-icon" />
              Subscribe
            </Button>
          </CardFooter>

          <input type="text" name="email_address_check" defaultValue="" className="input--hidden" />
          <input type="hidden" name="locale" defaultValue="en" />
        </form>
      </Card>

      <Script src="https://sibforms.com/forms/end-form/build/main.js" strategy="lazyOnload" />
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <Script
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
  );
};
