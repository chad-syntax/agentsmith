import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { H1 } from './typography';
import { Container } from './layout/container';

type HeroHeaderProps = {
  title?: string;
};

export const HeroHeader = ({ title = 'Agentsmith' }: HeroHeaderProps) => {
  return (
    <Container>
      <div className="flex justify-between items-center py-4 md:py-8">
        <Link href="/">
          <H1>{title}</H1>
        </Link>
        <ThemeSwitcher />
      </div>
    </Container>
  );
};
