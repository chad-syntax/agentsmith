'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PromptVariable } from '@/components/editors/PromptContentEditor';
import { VariablesEditor } from '@/components/prompt/VariablesEditor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/shadcn';

type VariablesSidebarProps = {
  variables: PromptVariable[];
  onVariablesChange?: (variables: PromptVariable[]) => void;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

export const VariablesSidebar = (props: VariablesSidebarProps) => {
  const { variables, onVariablesChange, readOnly = false, defaultOpen = true } = props;

  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('border-l bg-muted/50 transition-all duration-300', isOpen ? 'w-80' : 'w-12')}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
            </Button>
          </CollapsibleTrigger>
          {isOpen && <span className="font-medium ml-2">Variables</span>}
        </div>
      </div>

      <CollapsibleContent className="p-4">
        <VariablesEditor
          variables={variables}
          onVariablesChange={onVariablesChange}
          readOnly={readOnly || !onVariablesChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};
