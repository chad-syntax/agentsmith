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
import { JsonEditor } from '../editors/JsonEditor';
import { Label } from '@radix-ui/react-label';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { useApp } from '@/app/providers/app';

type VariablesSidebarProps = {
  variables: PromptVariable[];
  onVariablesChange?: (variables: PromptVariable[]) => void;
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
  const { selectedProjectUuid } = useApp();

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
        <div className="mb-4">
          <Label className="mb-2 ml-2">Global Context</Label>
          <JsonEditor readOnly value={globalContext} />
          <Link
            className="text-sm text-primary ml-2 hover:underline"
            href={routes.studio.projectGlobals(selectedProjectUuid)}
          >
            Edit Globals
          </Link>
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
