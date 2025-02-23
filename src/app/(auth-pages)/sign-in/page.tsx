import { SignInPage } from '@/page-components/SignInPage';
import { Message } from '@/components/form-message';

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return <SignInPage searchParams={searchParams} />;
}
