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
import { useApp } from '@/providers/app';
import { connectProject } from '@/app/actions/connect-project';
import type { GetProjectRepositoriesForOrganizationResult } from '@/lib/OrganizationsService';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OrganizationsService } from '@/lib/OrganizationsService';

const formSchema = z.object({
  projectId: z.string(),
  projectRepositoryId: z.number(),
  agentsmithFolder: z.string().default('agentsmith'),
});

type FormValues = z.infer<typeof formSchema>;

interface ConnectProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (values: FormValues) => void;
  projectRepositories?: GetProjectRepositoriesForOrganizationResult;
  defaultRepositoryId?: number;
  defaultProjectUuid?: string;
}

export const ConnectProjectModal = (props: ConnectProjectModalProps) => {
  const {
    open,
    onOpenChange,
    onSubmit: onSubmitCallback,
    projectRepositories: initialProjectRepositories,
    defaultRepositoryId,
    defaultProjectUuid,
  } = props;

  const [projectRepositories, setProjectRepositories] =
    useState<GetProjectRepositoriesForOrganizationResult>(initialProjectRepositories ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const { selectedOrganization } = useApp();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentsmithFolder: 'agentsmith',
      projectRepositoryId: defaultRepositoryId,
      projectId: defaultProjectUuid,
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

  useEffect(() => {
    if (initialProjectRepositories) return;
    const supabase = createClient();
    // const { services } = new AgentsmithServices({ supabase });
    const organizationsService = new OrganizationsService({ supabase });
    const initialize = async () => {
      const projectRepositories = await organizationsService.getProjectRepositoriesForOrganization(
        selectedOrganization.id,
      );
      setProjectRepositories(projectRepositories);
    };

    initialize();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      await connectProject({
        projectUuid: values.projectId,
        // agentsmithFolder: values.agentsmithFolder,
        agentsmithFolder: 'agentsmith',
        projectRepositoryId: values.projectRepositoryId,
        organizationUuid: selectedOrganization!.uuid,
      });
      onSubmitCallback?.(values);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to connect project:', error);
    } finally {
      setIsLoading(false);
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
      <DialogContent aria-describedby="connect-project-modal-description">
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

            {/* <FormField
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
            /> */}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect Project'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
