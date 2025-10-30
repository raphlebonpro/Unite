#!/bin/bash
set -e

echo "🏗️  --- SAFE PREBUILD POUR ANDROID (Unite) ---"

BACKUP_FILE="android_backup_full.tar.gz"

# 1️⃣ Sauvegarde du dossier Android
if [ -d "android" ]; then
  echo "📦 Sauvegarde du dossier android/ en cours..."
  tar -czf "$BACKUP_FILE" android/
  echo "✅ Sauvegarde terminée -> $BACKUP_FILE"
else
  echo "⚠️  Aucun dossier android/ trouvé, rien à sauvegarder."
fi

# 2️⃣ Prebuild propre Expo
echo ""
read -p "⚙️  Lancer maintenant le prebuild Expo ? (y/n): " confirm
if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
  echo "🧩 Exécution du prebuild..."
  npx expo prebuild --clean
  echo "✅ Prebuild terminé."
else
  echo "❌ Prebuild annulé. Sauvegarde conservée."
  exit 0
fi

# 3️⃣ Restauration automatique du backup
echo ""
read -p "♻️  Restaurer les fichiers android/ sauvegardés ? (y/n): " restore
if [[ "$restore" == "y" || "$restore" == "Y" ]]; then
  echo "📂 Restauration du dossier android/ depuis le backup..."
  rm -rf android/
  tar -xzf "$BACKUP_FILE"
  echo "✅ Restauration terminée."
else
  echo "⚠️  Tu as choisi de ne pas restaurer le backup. Le dossier android/ actuel reste celui généré par Expo."
fi

echo ""
echo "🚀 Process terminé avec succès."
echo "➡️  Backup : $BACKUP_FILE"
