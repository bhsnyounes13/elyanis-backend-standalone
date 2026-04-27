import { supabaseAdmin } from "./supabase.service.js";
import * as userService from "./user.service.js";
import { signAccessToken } from "../auth/jwt.js";
import type { UserRole } from "../types/auth.js";

/**
 * Register user with Supabase Auth
 */
export async function signUpWithSupabase(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Supabase signup failed: ${error.message}`);
  if (!data.user) throw new Error("No user returned from Supabase signup");

  return data.user;
}

/**
 * Login with Supabase Auth and issue JWT
 */
export async function loginWithSupabase(email: string, password: string) {
  // We'll validate credentials against our database (passwordHash empty for Supabase users)
  // For now, we call Supabase to verify - we need a workaround since admin.signInWithPassword doesn't exist
  // Use the public client instead
  const { supabaseClient } = await import("./supabase.service.js");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(`Supabase login failed: ${error.message}`);
  if (!data.user) throw new Error("No user returned from Supabase login");

  // Check if user exists in our database
  let user = await userService.findUserByEmail(email);
  if (!user) {
    // Create user record in our database
    user = await userService.createUser(email, "", "user");
  }

  // Issue our own JWT (not Supabase's)
  const accessToken = signAccessToken(user.id, user.email, user.role);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Change password in Supabase Auth
 */
export async function changePasswordSupabase(userId: string, newPassword: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) throw new Error(`Password change failed: ${error.message}`);
}

/**
 * Delete user from Supabase Auth
 */
export async function deleteUserSupabase(userId: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`User deletion failed: ${error.message}`);
}
