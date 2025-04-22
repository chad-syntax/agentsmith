import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
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
import { GetProjectRepositoriesForOrganizationResult } from '@/lib/GitHubService';
import { useEffect } from 'react';

const formSchema = z.object({
  projectId: z.string(),
  projectRepositoryId: z.number(),
  agentsmithFolder: z.string().default('agentsmith'),
});

type FormValues = z.infer<typeof formSchema>;

interface ConnectProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRepositories: GetProjectRepositoriesForOrganizationResult;
  defaultRepositoryId?: number;
}

export const ConnectProjectModal = (props: ConnectProjectModalProps) => {
  const { open, onOpenChange, projectRepositories, defaultRepositoryId } = props;
  const { selectedOrganization } = useApp();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentsmithFolder: 'agentsmith',
      projectRepositoryId: defaultRepositoryId,
    },
  });

  useEffect(() => {
    if (open && defaultRepositoryId !== undefined) {
      if (form.getValues('projectRepositoryId') !== defaultRepositoryId) {
        form.setValue('projectRepositoryId', defaultRepositoryId, { shouldValidate: true });
      }
    } else if (!open) {
      // Keep the value for now, reset can be handled by parent if needed.
    }
  }, [open, defaultRepositoryId, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await connectProject({
        projectUuid: values.projectId,
        agentsmithFolder: values.agentsmithFolder,
        projectRepositoryId: values.projectRepositoryId,
        organizationUuid: selectedOrganization!.uuid,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to connect project:', error);
    }
  };

  const handleRepositoryChange = (repoId: string) => {
    const repository = projectRepositories.find(
      (projectRepository) => projectRepository.id === Number(repoId),
    );
    if (repository) {
      form.setValue('projectRepositoryId', repository.id);
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="projectRepositoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository</FormLabel>
                  <Select
                    onValueChange={handleRepositoryChange}
                    defaultValue={defaultRepositoryId?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a repository" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectRepositories.map((projectRepository) => (
                        <SelectItem
                          key={projectRepository.id}
                          value={projectRepository.id.toString()}
                        >
                          {projectRepository.repository_full_name}
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
