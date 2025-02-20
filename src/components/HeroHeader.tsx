import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';

type HeroHeaderProps = {
  title?: string;
};

export const HeroHeader = ({ title = 'Agentsmith' }: HeroHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4 md:mb-12">
      <Link href="/">
        <h2 className="text-2xl md:text-5xl font-bold">{title}</h2>
      </Link>
      <ThemeSwitcher />
    </div>
  );
};
