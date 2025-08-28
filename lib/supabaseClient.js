import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://vznufgpbrunadydudbix.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bnVmZ3BicnVuYWR5ZHVkYml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODA2MTgsImV4cCI6MjA2NTI1NjYxOH0.sGrKe41qKMeIHcO4iCjxbNmfJAZH-6wYp3ZNJBzkfvQ';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
