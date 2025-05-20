import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';
import { H2 } from './typography';

type HeroHeaderProps = {
  title?: string;
};

export const HeroHeader = ({ title = 'Agentsmith' }: HeroHeaderProps) => {
  return (
    <div className="flex justify-between items-center py-4 md:py-8">
      <Link href="/">
        <H2 className="border-none">{title}</H2>
      </Link>
      <ThemeSwitcher />
    </div>
  );
};
