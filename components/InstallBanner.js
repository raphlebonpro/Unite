import React, { useEffect, useState } from 'react';
import { Platform, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CLE = 'unite-install-banner-ferme';

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const dejaInstallee =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const dansLeCadre = window.self !== window.top;
    let dejaFerme = false;
    try { dejaFerme = localStorage.getItem(CLE) === '1'; } catch {}
    if (dejaInstallee || dansLeCadre || dejaFerme) return;

    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setVisible(true);

    const capter = (e) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', capter);
    return () => window.removeEventListener('beforeinstallprompt', capter);
  }, []);

  const fermer = () => {
    setVisible(false);
    try { localStorage.setItem(CLE, '1'); } catch {}
  };

  const installer = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.carte}>
        <Image source={require('../assets/icon1.png')} style={styles.logo} />

        <View style={{ flex: 1 }}>
          <Text style={styles.titre}>Installe UniteApp</Text>
          {isIOS ? (
            <Text style={styles.texte}>
              Touche <Ionicons name="share-outline" size={14} color="#FE5D02" /> Partager, puis « Sur l'écran d'accueil ».
            </Text>
          ) : (
            <Text style={styles.texte}>
              {installEvent
                ? "Ajoute l'app à ton écran d'accueil."
                : "Menu ⋮ de Chrome, puis « Installer l'application »."}
            </Text>
          )}
        </View>

        {!isIOS && installEvent && (
          <TouchableOpacity style={styles.bouton} onPress={installer} activeOpacity={0.85}>
            <Text style={styles.boutonTexte}>Installer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={fermer} hitSlop={10} accessibilityLabel="Fermer">
          <Ionicons name="close" size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, bottom: 24, zIndex: 100 },
  carte: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  logo: { width: 44, height: 44, borderRadius: 12 },
  titre: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 2 },
  texte: { fontSize: 13, color: '#555', lineHeight: 18 },
  bouton: { backgroundColor: '#FE5D02', borderRadius: 12, paddingHorizontal: 14, height: 36, justifyContent: 'center' },
  boutonTexte: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});