import { LoginForm } from '@/components/login-form';

export const AuthPage = () => (
  <div className="container mt-16 md:mt-32 mx-auto flex justify-center">
    <div className="max-w-lg w-full px-4 md:px-8">
      <LoginForm />
    </div>
  </div>
);
