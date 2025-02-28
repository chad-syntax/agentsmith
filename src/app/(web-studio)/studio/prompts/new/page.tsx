import { CreatePromptPage } from '@/page-components/CreatePromptPage';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function NewPromptPage() {
  const supabase = await createClient();

  // Get current user's active project
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: userData } = await supabase
    .from('agentsmith_users')
    .select('id, projects(id)')
    .eq('auth_user_id', user.id)
    .single();

  const projectData = userData?.projects[0];

  console.log(projectData);

  if (!projectData) {
    // Redirect to home if user doesn't have an active project
    redirect('/studio');
  }

  return <CreatePromptPage projectId={projectData.id} />;
}
