'use client';

import * as Collapsible from '@radix-ui/react-collapsible';
import { IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';
import { PromptVariable } from '@/components/editors/PromptContentEditor';
import { VariablesEditor } from '@/components/prompt/VariablesEditor';

type VariablesSidebarProps = {
  variables: PromptVariable[];
  onVariablesChange?: (variables: PromptVariable[]) => void;
  readOnly?: boolean;
  defaultOpen?: boolean;
};

export const VariablesSidebar = (props: VariablesSidebarProps) => {
  const {
    variables,
    onVariablesChange,
    readOnly = false,
    defaultOpen = true,
  } = props;

  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`border-l bg-gray-50 transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-12'
      }`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Collapsible.Trigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <IconChevronRight
                className={`w-5 h-5 transition-transform ${
                  isOpen ? 'transform rotate-90' : ''
                }`}
              />
            </button>
          </Collapsible.Trigger>
          {isOpen && <span className="font-medium ml-2">Variables</span>}
        </div>
      </div>

      <Collapsible.Content className="p-4">
        {onVariablesChange ? (
          <VariablesEditor
            variables={variables}
            onVariablesChange={onVariablesChange}
            readOnly={readOnly}
          />
        ) : (
          <div className="space-y-4">
            {variables.map((variable) => (
              <div
                key={variable.id || variable.name}
                className="bg-white p-4 rounded-lg border"
              >
                <div className="font-medium mb-2">{variable.name}</div>
                <div className="text-sm text-gray-500">
                  <p>Type: {variable.type}</p>
                  <p>Required: {variable.required ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))}

            {variables.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                No variables found.
              </p>
            )}
          </div>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
