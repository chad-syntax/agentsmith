'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftIcon, ArrowRightIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { JoinOrganizationModal } from './modals/join-organization';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/utils/shadcn';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { routes } from '@/utils/routes';
import { useRouter } from 'next/navigation';

const roleOptions = [
  'Engineer / Developer',
  'Product Manager',
  'Founder / Executive',
  'Prompt Engineer',
  'Copywriter',
  'Other',
] as const;

const teamSizeOptions = ['Just me', '2–10', '11–50', '51–200', '200+'] as const;

const purposeOptions = [
  'Keep prompts organized',
  'Keep prompts between devs and non-devs in sync',
  'Test and evaluate prompts',
  'Monitor prompt performance',
  'Just checking it out',
] as const;

const whereDidYouHearAboutUsOptions = [
  'Google',
  'X (Twitter)',
  'LinkedIn',
  'ChatGPT or other LLMs',
  'Other',
] as const;

const formSchema = z
  .object({
    role: z.enum(roleOptions, {
      errorMap: () => ({ message: 'Please select a valid role.' }),
    }),
    roleOther: z.string().optional(),
    companyName: z.string().min(2, {
      message: 'Company name must be at least 2 characters.',
    }),
    teamSize: z.enum(teamSizeOptions, {
      errorMap: () => ({ message: 'Please select a valid team size.' }),
    }),
    purpose: z.array(z.enum(purposeOptions)).min(1, {
      message: 'Please select at least one purpose.',
    }),
    whereDidYouHearAboutUs: z.enum(whereDidYouHearAboutUsOptions, {
      errorMap: () => ({ message: 'Please select a valid option.' }),
    }),
    whereDidYouHearAboutUsOther: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'Other') {
        return data.roleOther && data.roleOther.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please specify your role.',
      path: ['roleOther'],
    },
  )
  .refine(
    (data) => {
      if (data.whereDidYouHearAboutUs === 'Other') {
        return (
          data.whereDidYouHearAboutUsOther && data.whereDidYouHearAboutUsOther.trim().length > 0
        );
      }
      return true;
    },
    {
      message: 'Please specify where you heard about us.',
      path: ['whereDidYouHearAboutUsOther'],
    },
  );

const onboardingQuestions = [
  {
    id: 'role',
    question: 'What best describes your role?',
    options: roleOptions,
  },
  {
    id: 'joinExistingOrganization',
    question: 'Are you joining an existing Agentsmith Organization?',
  },
  {
    id: 'companyName',
    question: "What's your company's name?",
  },
  {
    id: 'teamSize',
    question: 'How big is your team?',
    options: teamSizeOptions,
  },
  {
    id: 'purpose',
    question: 'What do you hope to get out of Agentsmith?',
    options: purposeOptions,
  },
  {
    id: 'whereDidYouHearAboutUs',
    question: 'Where did you hear about us?',
    options: whereDidYouHearAboutUsOptions,
  },
];

export const StudioPageOnboarding = () => {
  const [joinOrganizationModalOpen, setJoinOrganizationModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoinOrganizationClick = async () => {
    try {
      const supabase = createClient();
      const values = form.getValues();
      const { error } = await supabase.rpc('update_agentsmith_user_onboarding', {
        arg_onboarding_data: values,
      });

      if (error) {
        console.error('Error updating onboarding:', error);
        toast.error('Error updating onboarding, please try again or contact support.');
        return;
      }
    } catch (err) {
      console.error('Error updating onboarding:', err);
      toast.error('Error updating onboarding, please try again or contact support.');
      return;
    }

    setJoinOrganizationModalOpen(true);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: undefined,
      roleOther: '',
      companyName: '',
      teamSize: undefined,
      purpose: [],
      whereDidYouHearAboutUs: undefined,
      whereDidYouHearAboutUsOther: '',
    },
  });

  const selectedRole = form.watch('role');
  const selectedWhereDidYouHearAboutUs = form.watch('whereDidYouHearAboutUs');

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = await form.trigger('role');
        break;
      case 1:
        // No validation needed for yes/no step
        isValid = true;
        break;
      case 2:
        isValid = await form.trigger('companyName');
        break;
      case 3:
        isValid = await form.trigger('teamSize');
        break;
      case 4:
        isValid = await form.trigger('purpose');
        break;
      case 5:
        isValid = await form.trigger('whereDidYouHearAboutUs');
        break;
      default:
        isValid = false;
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Final form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const supabase = createClient();

    try {
      const { error } = await supabase.rpc('update_agentsmith_user_onboarding', {
        arg_onboarding_data: values,
      });

      if (error) {
        console.error('Error saving onboarding:', error);
        toast.error('Error saving onboarding, please try again or contact support.');
        setIsLoading(false);
        return;
      }

      // create organization
      const { data, error: organizationError } = await supabase.rpc('create_organization_v2', {
        arg_name: values.companyName,
      });

      if (organizationError) {
        console.error('Error creating organization:', organizationError);
        toast.error('Error creating organization, please try again or contact support.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.error('No organization data returned, please try again');
        toast.error('No organization data returned, please try again');
        setIsLoading(false);
        return;
      }

      const organizationData = data as { organization_uuid: string; project_uuid: string };

      // redirect to project page
      router.push(routes.studio.project(organizationData.project_uuid));
    } catch (err) {
      console.error('Error submitting onboarding:', err);
      toast.error('Error submitting onboarding, please try again or contact support.');
      setIsLoading(false);
      return;
    }
  };

  return (
    <>
      <JoinOrganizationModal
        open={joinOrganizationModalOpen}
        onOpenChange={setJoinOrganizationModalOpen}
      />

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Agentsmith!</CardTitle>
          <div className="text-muted-foreground font-normal text-md">Let's get you set up.</div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-full sm:w-1/2 mx-auto"
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className={cn(currentStep !== 0 && 'hidden')}>
                    <FormLabel>{onboardingQuestions[0].question}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleOther"
                render={({ field }) => (
                  <FormItem
                    className={cn(currentStep !== 0 || selectedRole !== 'Other' ? 'hidden' : '')}
                  >
                    <FormControl>
                      <Input {...field} placeholder="Enter your role" />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <div className={cn(currentStep !== 1 && 'hidden')}>
                <FormLabel className="text-center mb-6">
                  {onboardingQuestions[1].question}
                </FormLabel>
                <div className="flex flex-col gap-2 mt-2 justify-center">
                  <Button
                    size="lg"
                    className="flex-1 py-2"
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    No
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 py-2"
                    type="button"
                    variant="outline"
                    onClick={handleJoinOrganizationClick}
                  >
                    Yes, I have an invite code
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className={cn(currentStep !== 2 && 'hidden')}>
                    <FormLabel>{onboardingQuestions[2].question}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Acme Inc." />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem className={cn(currentStep !== 3 && 'hidden')}>
                    <FormLabel>{onboardingQuestions[3].question}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamSizeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem className={cn(currentStep !== 4 && 'hidden')}>
                    <FormLabel className="mb-2">{onboardingQuestions[4].question}</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {purposeOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={option}
                              className="cursor-pointer"
                              checked={field.value?.includes(option)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, option]);
                                } else {
                                  field.onChange(currentValues.filter((value) => value !== option));
                                }
                              }}
                            />
                            <label
                              htmlFor={option}
                              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whereDidYouHearAboutUs"
                render={({ field }) => (
                  <FormItem className={cn(currentStep !== 5 && 'hidden')}>
                    <FormLabel>{onboardingQuestions[5].question}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full truncate">
                          <SelectValue placeholder="Select where you heard about us" />
                        </SelectTrigger>
                        <SelectContent>
                          {whereDidYouHearAboutUsOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whereDidYouHearAboutUsOther"
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      currentStep !== 5 || selectedWhereDidYouHearAboutUs !== 'Other'
                        ? 'hidden'
                        : '',
                    )}
                  >
                    <FormControl>
                      <Input {...field} placeholder="Enter where you heard about us" />
                    </FormControl>
                    <FormMessage className="text-destructive" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 0 || isLoading}
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </Button>

                {currentStep < onboardingQuestions.length - 1 && (
                  <Button type="button" variant="outline" onClick={handleNext}>
                    Next
                    <ArrowRightIcon className="w-4 h-4" />
                  </Button>
                )}

                {currentStep === onboardingQuestions.length - 1 && (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finish'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
