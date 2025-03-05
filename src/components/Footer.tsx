import Link from 'next/link';
import { Container } from './layout/container';
import { Small } from './typography';
import { Separator } from './ui/separator';

export const Footer = () => {
  return (
    <Container>
      <Separator className="my-4" />
      <div className="flex flex-col items-center gap-2 py-4">
        <Link href="/privacy-policy">
          <Small className="hover:underline">Privacy Policy</Small>
        </Link>
        <Small>© {new Date().getFullYear()} Chad Syntax LLC</Small>
      </div>
    </Container>
  );
};
