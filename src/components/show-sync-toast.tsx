import { toast } from 'sonner';
import { SyncProjectButton } from './SyncProjectButton';

type ShowSyncToastOptions = {
  title: string;
  description?: string;
};

export const showSyncToast = (options: ShowSyncToastOptions) => {
  const { title, description } = options;

  const toastId = toast(title, {
    description: description ?? 'Would you like to sync your project?',
    duration: 6000,
    action: (
      <SyncProjectButton
        onSyncComplete={() => {
          toast.dismiss(toastId);
        }}
      />
    ),
  });
};
