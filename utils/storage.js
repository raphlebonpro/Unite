import { supabase } from "../lib/supabaseClient";

export async function uploadPublicImage(bucket, fileUri, fileName) {
  try {
    console.log("🚀 Upload direct via fetch(arrayBuffer):", fileUri);

    // Lecture directe du fichier binaire
    const res = await fetch(fileUri);
    if (!res.ok) throw new Error(`Échec de lecture locale (${res.status})`);

    const arrayBuffer = await res.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    console.log("📏 Taille du buffer:", fileBytes.length);

    if (fileBytes.length < 1000) {
      console.warn("⚠️ Données trop petites, fichier probablement vide");
    }

    const path = `${Date.now()}_${fileName}`;
    console.log("🗂️ Upload vers:", path);

    const { error } = await supabase.storage.from(bucket).upload(path, fileBytes, {
      contentType: "image/jpeg",
      upsert: false,
    });

    if (error) {
      console.error("❌ Erreur Supabase:", error);
      throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log("✅ Upload terminé:", data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error("🔥 uploadPublicImage ERROR:", err);
    throw err;
  }
}
