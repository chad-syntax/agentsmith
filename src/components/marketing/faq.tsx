'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import posthog from 'posthog-js';
import { ReactNode } from 'react';

type FaqItem = {
  value: string;
  trigger: string;
  content: ReactNode;
  jsonLdContent?: string;
};

const faqData: FaqItem[] = [
  {
    value: 'prompt-cms',
    trigger: 'What is a Prompt CMS?',
    content:
      'A Prompt CMS (Content Management System) is a specialized platform for creating, organizing, versioning, and managing AI prompts at scale. Think of it like a Git repository for your prompts, but with additional features like testing, collaboration, and deployment tools. It helps teams maintain consistency, track changes, and ensure quality across all their AI applications.',
  },
  {
    value: 'improve-ai-development',
    trigger: 'How does Agentsmith improve my AI agent development process?',
    content:
      'Agentsmith streamlines AI agent development by providing a centralized platform for managing prompts, testing, and versioning. It allows you to refine your prompts and then safely hand them off to your engineering team to integrate into the codebase.',
  },
  {
    value: 'byok-llm-provider',
    trigger: 'Can I bring my own LLM provider keys?',
    content: (
      <>
        Yes you can! OpenRouter supports BYOK, read more here:{' '}
        <a
          href="https://openrouter.ai/docs/use-cases/byok"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          https://openrouter.ai/docs/use-cases/byok
        </a>
      </>
    ),
    jsonLdContent:
      'Yes you can! OpenRouter supports BYOK, read more here: https://openrouter.ai/docs/use-cases/byok',
  },
  {
    value: 'execute-prompts',
    trigger: 'Do I have to use Agentsmith to execute my prompts?',
    content:
      'Nope! You can use Agentsmith to just organize and compile your prompts. Once the prompts are compiled you have just a string or a messages array to pass along to whatever setup you have.',
  },
  {
    value: 'use-openrouter',
    trigger: 'Do I have to use OpenRouter?',
    content:
      'OpenRouter is required to use the Agentsmith Studio as it executes prompts for testing and evaluating. You do not have to use OpenRouter in your codebase, you can use Agentsmith to only compile your prompts and then you can decide what to do.',
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
      'Agentsmith integrates smoothly with your current setup. You can synchronize prompt versions directly to your Git repository via Pull Requests, ensuring total control by your engineering team. You have the option to use our SDKs to execute prompts, just compile the prompts and execute them yourself, or import the jinja files and compile the prompts yourself.',
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
      'We offer multiple plans to suit different needs: a Free plan for personal projects, a Hobby plan at $9.99/month or $99.99/year (50% off during alpha), a Pro plan at $24.99/month or $249.99/year (50% off during alpha) for professional teams, and an Enterprise plan for large-scale applications. All plans include our core features with varying limits on prompts, users, projects, and logs.',
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
    content: (
      <>
        Send an email to{' '}
        <a
          href="mailto:support@agentsmith.dev"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          support@agentsmith.dev
        </a>
        . All users, including those on the Community plan, can access community support through our
        GitHub repository and participate in discussions.
      </>
    ),
    jsonLdContent:
      'Send an email to support@agentsmith.dev. All users, including those on the Community plan, can access community support through our GitHub repository and participate in discussions.',
  },
];

export const FAQSection = () => {
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
        text: item.jsonLdContent || (typeof item.content === 'string' ? item.content : ''),
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
