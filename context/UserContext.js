// context/UserContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserContext = createContext();
const AVATAR_BUCKET = 'avatars'; // adapte si besoin

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const resolvePublicAvatarUrl = useCallback((profile) => {
    if (!profile) return null;
    if (profile.avatar_url && typeof profile.avatar_url === 'string') return profile.avatar_url;
    if (profile.avatar_path && typeof profile.avatar_path === 'string') {
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(profile.avatar_path);
      return data?.publicUrl || null;
    }
    return null;
  }, []);

const fetchUserProfile = useCallback(
  async (authUser) => {
    if (!authUser) {
      setUser(null);
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && status !== 406) {
        // ⚠️ Erreur RLS = profil pas encore créé → on ignore
        console.warn("⚠️ Impossible de lire le profil (probablement RLS ou profil inexistant)", error.message);
        setUser(authUser);
        setAvatarUrl(null);
        setLoading(false);
        return;
      }

      // ✅ Fusionne les infos auth + profil s’il existe
      const merged = data ? { ...authUser, ...data } : authUser;
      setUser(merged);
      setAvatarUrl(resolvePublicAvatarUrl(data));
      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur fetchUserProfile:", err.message);
      setUser(authUser);
      setAvatarUrl(null);
      setLoading(false);
    }
  },
  [resolvePublicAvatarUrl]
);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const authUser = data?.user || null;
    await fetchUserProfile(authUser);
  }, [fetchUserProfile]);

  const bumpAvatarVersion = useCallback(() => setAvatarVersion((v) => v + 1), []);

  useEffect(() => {
    let unsub = null;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user || null;
      await fetchUserProfile(authUser);

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const nextAuthUser = session?.user || null;
        await fetchUserProfile(nextAuthUser);
      });
      unsub = authListener?.subscription;
    };

    init();

    return () => {
      if (unsub && typeof unsub.unsubscribe === 'function') unsub.unsubscribe();
    };
  }, [fetchUserProfile]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        avatarUrl,
        avatarVersion,
        bumpAvatarVersion,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);