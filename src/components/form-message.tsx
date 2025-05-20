import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      {'success' in message && (
        <Alert variant="default" className="border-l-4 border-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{message.success}</AlertDescription>
        </Alert>
      )}
      {'error' in message && (
        <Alert variant="destructive" className="border-l-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.error}</AlertDescription>
        </Alert>
      )}
      {'message' in message && (
        <Alert variant="default" className="border-l-4 border-foreground">
          <Info className="h-4 w-4" />
          <AlertDescription>{message.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
