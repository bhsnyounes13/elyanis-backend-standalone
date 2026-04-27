import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

const supabaseUrl = config.supabase.projectUrl;
const supabaseAnonKey = config.supabase.anonKey;
const supabaseServiceKey = config.supabase.serviceRoleKey;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
