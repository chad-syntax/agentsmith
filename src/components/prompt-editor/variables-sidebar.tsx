'use client';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { VariablesEditor } from '@/components/prompt-editor/variables-editor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/shadcn';
import { GlobalsList } from '@/components/project/GlobalsList';
import { Badge } from '../ui/badge';
import { Database } from '@/app/__generated__/supabase.types';
import { routes } from '@/utils/routes';
import Link from 'next/link';
import { useApp } from '@/providers/app';
import { usePromptPage } from '@/providers/prompt-page';
import { PromptConfigEditor } from './prompt-config-editor';
import { ModelSelect } from './model-select';

type VariableType = Database['public']['Enums']['variable_type'];

const typeColors: Record<VariableType, string> = {
  STRING: 'bg-green-500',
  NUMBER: 'bg-orange-500',
  BOOLEAN: 'bg-blue-500',
  JSON: 'bg-red-500',
};

const getBadgeColor = (type: VariableType) => {
  return typeColors[type] || 'bg-gray-500 hover:bg-gray-600';
};

type VariablesSidebarProps = {
  readOnly?: boolean;
};

export const VariablesSidebar = (props: VariablesSidebarProps) => {
  const { readOnly = false } = props;

  const [isOpen, setIsOpen] = useState(true);

  const { selectedProjectUuid } = useApp();
  const { state } = usePromptPage();

  const { includedPrompts, globalContext } = state;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'border-l bg-muted/50 transition-all duration-300 overflow-scroll pb-12',
        isOpen ? 'w-80' : 'w-12',
      )}
    >
      <div className="py-4 px-2 border-b flex items-center justify-between">
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="p-4">
        {/* <div>
            <div className="pb-2 flex justify-between">
              <div className="flex items-center gap-2">
                Config
                <a
                  className="text-xs flex items-center gap-1 underline text-primary"
                  href="https://openrouter.ai/docs/api-reference/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Config Reference
                  <ExternalLink size={12} />
                </a>
              </div>
              <a
                className="text-xs flex items-center gap-1 underline text-primary"
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Available Models on OpenRouter
                <ExternalLink size={12} />
              </a>
            </div>
            <JsonEditor
              value={(editorConfig as object) || {}}
              onChange={(value) => {
                updateEditorConfig(value);
              }}
            />
          </div> */}
        <div className="pb-8">
          <Accordion type="single" collapsible defaultValue="config" className="w-full">
            <AccordionItem value="config">
              <AccordionTrigger className="cursor-pointer border-b border-muted-foreground rounded-none">
                Config
              </AccordionTrigger>
              <AccordionContent className="mt-4">
                <PromptConfigEditor readOnly={readOnly} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div>
          <h2 className="text-sm font-medium border-b border-muted-foreground pb-4">Variables</h2>
        </div>
        <VariablesEditor readOnly={readOnly} />
        {includedPrompts.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium border-b border-muted-foreground pb-4">
              Included Prompts
            </h2>
            <Accordion type="multiple" className="w-full mt-2">
              {includedPrompts.map((ip) => {
                const slug = ip.prompt_versions.prompts.slug;
                const version = ip.prompt_versions.version;
                const variables = ip.prompt_versions.prompt_variables;
                return (
                  <AccordionItem key={`${slug}@${version}`} value={`${slug}@${version}`}>
                    <AccordionTrigger className="cursor-pointer">
                      <div className="font-medium flex items-center">
                        {slug}
                        <span className="ml-2 text-xs text-muted-foreground">v{version}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {variables && variables.length > 0 ? (
                        <>
                          <ul className="list-disc list-inside ml-4">
                            {variables.map((v) => (
                              <li key={v.name} className="mb-2">
                                <div className="inline-flex items-center gap-2">
                                  <div className="flex justify-start items-start gap-0.5">
                                    <span className="font-medium hover:underline">{v.name}</span>
                                    {v.required && (
                                      <span className="text-destructive leading-none">*</span>
                                    )}
                                  </div>
                                  <Badge className={cn('text-white', getBadgeColor(v.type))}>
                                    {v.type}
                                  </Badge>
                                  {v.default_value && (
                                    <span className="ml-2 text-muted-foreground text-xs">
                                      (default: <span className="font-mono">{v.default_value}</span>
                                      )
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground ml-4">No variables</div>
                      )}
                      <div className="mt-2">
                        <Link
                          href={routes.studio.editPromptVersion(
                            selectedProjectUuid,
                            ip.prompt_versions.uuid,
                          )}
                          className="text-xs text-primary hover:underline flex items-center gap-1 ml-4"
                        >
                          Edit
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
        <div>
          <Accordion type="single" collapsible className="w-full pt-4">
            <AccordionItem value="globals">
              <AccordionTrigger className="cursor-pointer border-b border-muted-foreground rounded-none">
                Globals
              </AccordionTrigger>
              <AccordionContent className="mt-4">
                <GlobalsList globalContext={globalContext} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const VariablesSidebarSkeleton = () => (
  <div className="w-80 border-l bg-background p-4">
    <div className="mb-4">
      <div className="bg-muted rounded w-24 h-6 animate-pulse">&nbsp;</div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="bg-muted rounded w-full h-16 animate-pulse">
          &nbsp;
        </div>
      ))}
    </div>
  </div>
);
