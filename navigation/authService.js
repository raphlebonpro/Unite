import { supabase } from "../lib/supabaseClient";

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { data, error };

  // Appeler l’Edge Function pour créer le profil
  if (data?.user) {
    await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create_user_profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token || ""}`, // JWT user
      },
      body: JSON.stringify({
        user_id: data.user.id,
        email: data.user.email,
      }),
    });
  }

  return { data, error: null };
};

export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};
