'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { usePostHog } from 'posthog-js/react';

const faqData = [
  {
    value: 'improve-ai-development',
    trigger: 'How does Agentsmith improve my AI agent development process?',
    content:
      'Agentsmith streamlines AI agent development with intuitive prompt authoring for all skill levels, robust testing capabilities, seamless Git integration for version control, and typesafe SDKs (TypeScript & Python). This means you can build, refine, and deploy more reliable AI agents, faster.',
  },
  {
    value: 'user-friendliness',
    trigger: "Is Agentsmith suitable if I'm not an expert developer?",
    content:
      'Absolutely! Agentsmith is designed with an intuitive interface for prompt engineering, making it accessible for both technical and non-technical users. You can craft and manage sophisticated AI prompts without deep coding knowledge.',
  },
  {
    value: 'integration-workflow',
    trigger: 'How does Agentsmith fit into my existing development workflow?',
    content:
      'Agentsmith integrates smoothly with your current setup. You can synchronize prompt versions directly to your Git repository via Pull Requests, ensuring version control and team collaboration. Our typesafe SDKs for TypeScript and Python allow for confident integration into your applications.',
  },
  {
    value: 'model-flexibility',
    trigger: 'Can I use different AI models or switch providers with Agentsmith?',
    content:
      'Yes, Agentsmith supports provider switching through OpenRouter. This gives you the flexibility to choose the best AI models for your needs and optimize costs without being locked into a single provider.',
  },
  {
    value: 'plans-and-access',
    trigger: 'What are the available plans and how can I get access?',
    content:
      'We offer a Pro plan at $599/year (currently 50% off during our alpha phase) for advanced features and priority support. A free Community plan is also available for open-source contributors and hobbyists. Join our waitlist to be notified about cloud availability and get early access!',
  },
  {
    value: 'open-source-benefits',
    trigger: 'What are the benefits of Agentsmith being open source?',
    content:
      'As an open-source platform, Agentsmith offers transparency in its development, encourages community contributions, and gives you the freedom to view, modify, and even self-host the software. This fosters innovation and ensures the platform evolves with user needs.',
  },
  {
    value: 'support-options',
    trigger: 'How do I get support?',
    content:
      'Pro plan users receive priority support via email. All users, including those on the Community plan, can access community support through our GitHub repository and participate in discussions.',
  },
];

export const FAQSection = () => {
  const posthog = usePostHog();

  const handleAccordionTriggerClick = (faqItem: (typeof faqData)[number]) => {
    posthog.capture('faq_accordion_trigger_clicked', {
      value: faqItem.value,
    });
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((item) => ({
      '@type': 'Question',
      name: item.trigger,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.content,
      },
    })),
  };

  return (
    <section id="faq" className="bg-background scroll-mt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container px-4 md:px-6 relative mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about Agentsmith
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faqItem) => (
              <AccordionItem key={faqItem.value} value={faqItem.value} className="border-border">
                <AccordionTrigger
                  onClick={() => handleAccordionTriggerClick(faqItem)}
                  className="text-foreground hover:text-foreground/90 cursor-pointer"
                >
                  {faqItem.trigger}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faqItem.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
