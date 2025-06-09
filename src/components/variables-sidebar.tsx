'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { VariablesEditor } from '@/components/editors/variables-editor';
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
import { EditorPromptVariable } from '@/types/prompt-editor';

type VariablesSidebarProps = {
  variables: EditorPromptVariable[];
  onVariablesChange?: (variables: EditorPromptVariable[]) => void;
  readOnly?: boolean;
  defaultOpen?: boolean;
  globalContext: any;
};

export const VariablesSidebar = (props: VariablesSidebarProps) => {
  const {
    variables,
    onVariablesChange,
    readOnly = false,
    defaultOpen = true,
    globalContext,
  } = props;

  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('border-l bg-muted/50 transition-all duration-300', isOpen ? 'w-80' : 'w-12')}
    >
      <div className="py-4 px-2 border-b flex items-center justify-between">
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
            </Button>
          </CollapsibleTrigger>
          {isOpen && <span className="font-medium ml-2">Variables</span>}
        </div>
      </div>

      <CollapsibleContent className="p-4.5">
        <div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="globals">
              <AccordionTrigger className="cursor-pointer">Globals</AccordionTrigger>
              <AccordionContent>
                <GlobalsList globalContext={globalContext} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <VariablesEditor
          variables={variables}
          onVariablesChange={onVariablesChange}
          readOnly={readOnly || !onVariablesChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};
