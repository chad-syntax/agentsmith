import Link from 'next/link';

export const Footer = () => {
  return (
    <div className="py-4 w-full text-center">
      <div>
        <Link className="text-xs hover:underline" href="/privacy-policy">
          Privacy Policy
        </Link>
      </div>
      <p className="text-xs">© {new Date().getFullYear()} Chad Syntax LLC</p>
    </div>
  );
};
