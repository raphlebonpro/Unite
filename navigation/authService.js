import { supabase } from "../lib/supabaseClient";

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { data, error };

  if (data?.user) {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create_user_profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ❌ on supprime le JWT user vide
          // pas besoin de header Authorization ici
        },
        body: JSON.stringify({
          user_id: data.user.id,
          email: data.user.email,
        }),
      });
    } catch (err) {
      console.error("Erreur appel create_user_profile:", err);
    }
  }

  return { data, error: null };
};
