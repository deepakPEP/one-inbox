// AWS Amplify v6 - Import auth module and use type assertions
// The functions exist at runtime but may not be properly typed in v6
import * as authModule from 'aws-amplify/auth';

// Type-safe wrapper for auth functions
const auth = authModule as any;

export type SignInParams = {
  username: string;
  password: string;
};

export type SignUpParams = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ResendSignUpCodeParams = {
  username: string;
};

export type ConfirmSignUpParams = {
  username: string;
  confirmationCode: string;
};

export type ResetPasswordParams = {
  username: string;
};

export type ConfirmResetPasswordParams = {
  username: string;
  confirmationCode: string;
  newPassword: string;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ username, password }: SignInParams): Promise<void> => {
  await auth.signIn({ username, password });
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  username,
  password,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  await auth.signUp({
    username,
    password,
    options: { userAttributes: { email: username, given_name: firstName, family_name: lastName } },
  });
};

/** **************************************
 * Confirm sign up
 *************************************** */
export const confirmSignUp = async ({
  username,
  confirmationCode,
}: ConfirmSignUpParams): Promise<void> => {
  await auth.confirmSignUp({ username, confirmationCode });
};

/** **************************************
 * Resend code sign up
 *************************************** */
export const resendSignUpCode = async ({ username }: ResendSignUpCodeParams): Promise<void> => {
  await auth.resendSignUpCode({ username });
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  await auth.signOut();
};

/** **************************************
 * Reset password
 *************************************** */
export const resetPassword = async ({ username }: ResetPasswordParams): Promise<void> => {
  await auth.resetPassword({ username });
};

/** **************************************
 * Update password
 *************************************** */
export const updatePassword = async ({
  username,
  confirmationCode,
  newPassword,
}: ConfirmResetPasswordParams): Promise<void> => {
  await auth.confirmResetPassword({ username, confirmationCode, newPassword });
};
