import { routes } from '@/utils/routes';
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect(routes.marketing.landing1);
}
