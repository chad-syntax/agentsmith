// 'use server';

// import { encodedRedirect } from '@/utils/utils';
// import { createClient } from '@/lib/supabase/server';
// import { headers } from 'next/headers';
// import { redirect } from 'next/navigation';
// import { routes } from '@/utils/routes';

// export const signUpAction = async (formData: FormData) => {
//   const email = formData.get('email')?.toString();
//   const password = formData.get('password')?.toString();
//   const supabase = await createClient();
//   const origin = (await headers()).get('origin');

//   if (!email || !password) {
//     return encodedRedirect('error', routes.auth.signUp, 'Email and password are required');
//   }

//   const { error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       emailRedirectTo: `${origin}/auth/callback`,
//     },
//   });

//   if (error) {
//     console.error(error.code + ' ' + error.message);
//     return encodedRedirect('error', routes.auth.signUp, error.message);
//   } else {
//     return encodedRedirect(
//       'success',
//       routes.auth.signUp,
//       'Thanks for signing up! Please check your email for a verification link.',
//     );
//   }
// };

// export const signInAction = async (formData: FormData) => {
//   const email = formData.get('email') as string;
//   const password = formData.get('password') as string;
//   const supabase = await createClient();

//   const { error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });

//   if (error) {
//     return encodedRedirect('error', routes.auth.signIn, error.message);
//   }

//   return redirect(routes.studio.home);
// };

// export const forgotPasswordAction = async (formData: FormData) => {
//   const email = formData.get('email')?.toString();
//   const supabase = await createClient();
//   const origin = (await headers()).get('origin');
//   const callbackUrl = formData.get('callbackUrl')?.toString();

//   if (!email) {
//     return encodedRedirect('error', routes.auth.forgotPassword, 'Email is required');
//   }

//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo: `${origin}/auth/callback?redirect_to=${routes.studio.account}`,
//   });

//   if (error) {
//     console.error(error.message);
//     return encodedRedirect('error', routes.auth.forgotPassword, 'Could not reset password');
//   }

//   if (callbackUrl) {
//     return redirect(callbackUrl);
//   }

//   return encodedRedirect(
//     'success',
//     routes.auth.forgotPassword,
//     'Check your email for a link to reset your password.',
//   );
// };

// export const resetPasswordAction = async (formData: FormData) => {
//   const supabase = await createClient();

//   const password = formData.get('password') as string;
//   const confirmPassword = formData.get('confirmPassword') as string;

//   if (!password || !confirmPassword) {
//     encodedRedirect(
//       'error',
//       routes.studio.resetPassword,
//       'Password and confirm password are required',
//     );
//   }

//   if (password !== confirmPassword) {
//     encodedRedirect('error', routes.studio.resetPassword, 'Passwords do not match');
//   }

//   const { error } = await supabase.auth.updateUser({
//     password: password,
//   });

//   if (error) {
//     encodedRedirect('error', routes.studio.resetPassword, 'Password update failed');
//   }

//   encodedRedirect('success', routes.studio.resetPassword, 'Password updated');
// };
