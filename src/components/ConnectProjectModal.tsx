import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/app/providers/app';
import { connectProject } from '@/actions/connect-project';
import { GetInstallationRepositoriesResult } from '@/lib/GitHubService';

const formSchema = z.object({
  projectId: z.string(),
  repositoryId: z.number(),
  agentsmithFolder: z.string().default('agentsmith'),
});

type FormValues = z.infer<typeof formSchema>;

interface ConnectProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationRepositories: GetInstallationRepositoriesResult;
}

export const ConnectProjectModal = (props: ConnectProjectModalProps) => {
  const { open, onOpenChange, installationRepositories } = props;
  const { selectedOrganization } = useApp();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentsmithFolder: 'agentsmith',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await connectProject({
        projectUuid: values.projectId,
        agentsmithFolder: values.agentsmithFolder,
        repositoryId: values.repositoryId,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to connect project:', error);
    }
  };

  const handleRepositoryChange = (repoId: string) => {
    const repository = installationRepositories.find(
      (repo) => repo.id === Number(repoId)
    );
    if (repository) {
      form.setValue('repositoryId', repository.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Project to Repository</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedOrganization?.projects?.map((project) => (
                        <SelectItem key={project.uuid} value={project.uuid}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repositoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository</FormLabel>
                  <Select
                    onValueChange={handleRepositoryChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a repository" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {installationRepositories.map((repo) => (
                        <SelectItem key={repo.id} value={repo.id.toString()}>
                          {repo.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agentsmithFolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agentsmith Directory</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Connect Project
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
