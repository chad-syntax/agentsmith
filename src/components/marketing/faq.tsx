import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqData = [
  {
    value: 'item-1',
    trigger: 'What is Agentsmith?',
    content:
      'Agentsmith is an AI agent development platform that provides exceptional prompt authoring capabilities for both technical and non-technical users. It allows you to build, test, and deploy AI agents with confidence.',
  },
  {
    value: 'item-2',
    trigger: 'When will Agentsmith be available?',
    content:
      "Agentsmith is currently in alpha phase. Join our waitlist to be notified when it\'s available and to get early access.",
  },
  {
    value: 'item-3',
    trigger: 'How does the pricing work?',
    content:
      'We offer a Pro plan at $200/year with a 50% discount for the first year during our alpha phase. A free Community plan is available for open-source contributors and hobbyists.',
  },
  {
    value: 'item-4',
    trigger: 'Is Agentsmith open source?',
    content:
      'Yes, Agentsmith is open source. You can contribute to the project and view the source code on GitHub.',
  },
  {
    value: 'item-5',
    trigger: 'How do I get support?',
    content:
      'Pro users get priority support via email. Community support is available for all users through our GitHub repository.',
  },
];

export const FAQSection = () => {
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
    <section id="faq" className="bg-background">
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
                <AccordionTrigger className="text-foreground hover:text-foreground/90">
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
