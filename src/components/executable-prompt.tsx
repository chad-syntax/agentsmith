import { useState } from 'react';
import { Database } from '@/app/__generated__/supabase.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/shadcn';

type PromptVariable = {
  name: string;
  type: Database['public']['Enums']['variable_type'] | string;
  required: boolean;
};

type ExecutablePromptProps = {
  name: string;
  id: string;
  variables: PromptVariable[];
  onExecute: (variables: Record<string, string>) => Promise<void>;
  isAction?: boolean;
};

export const ExecutablePrompt = ({
  name,
  id,
  variables,
  onExecute,
  isAction = true,
}: ExecutablePromptProps) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    setResponse(null);

    try {
      await onExecute(inputValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute');
    } finally {
      setIsExecuting(false);
    }
  };

  const isValid = variables.every(
    (variable) => !variable.required || inputValues[variable.name]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variables.map((variable) => (
          <div key={variable.name} className="space-y-2">
            <Label>
              {variable.name}
              {variable.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            {variable.type === 'string' && (
              <Textarea
                value={inputValues[variable.name] || ''}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [variable.name]: e.target.value,
                  }))
                }
                rows={3}
              />
            )}
            {variable.type === 'number' && (
              <Input
                type="number"
                value={inputValues[variable.name] || ''}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [variable.name]: e.target.value,
                  }))
                }
              />
            )}
            {variable.type === 'boolean' && (
              <Select
                value={inputValues[variable.name] || ''}
                onValueChange={(value) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [variable.name]: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        <div className="pt-4">
          <Button
            onClick={handleExecute}
            disabled={!isValid || isExecuting}
            className="w-full"
          >
            {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExecuting
              ? 'Executing...'
              : `Execute ${isAction ? 'Action' : 'Reaction'}`}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <div className="space-y-2">
            <Label>Response:</Label>
            <pre
              className={cn('rounded-md bg-muted p-4 overflow-auto text-sm')}
            >
              {response}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
