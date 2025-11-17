#!/bin/bash
set -e

echo "🍎  --- SAFE PREBUILD POUR iOS (Unite) ---"

BACKUP_FILE="ios_backup_full.tar.gz"

# 1️⃣ Sauvegarde du dossier iOS
if [ -d "ios" ]; then
  echo "📦 Sauvegarde du dossier ios/ en cours..."
  tar -czf "$BACKUP_FILE" ios/
  echo "✅ Sauvegarde terminée -> $BACKUP_FILE"
else
  echo "⚠️  Aucun dossier ios/ trouvé, rien à sauvegarder."
fi

# 2️⃣ Prebuild propre Expo
echo ""
read -p "⚙️  Lancer maintenant le prebuild Expo pour iOS ? (y/n): " confirm
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
read -p "♻️  Restaurer les fichiers iOS sauvegardés ? (y/n): " restore
if [[ "$restore" == "y" || "$restore" == "Y" ]]; then
  echo "📂 Restauration du dossier ios/ depuis le backup..."
  rm -rf ios/
  tar -xzf "$BACKUP_FILE"
  echo "✅ Restauration terminée."
else
  echo "⚠️  Tu as choisi de ne pas restaurer le backup. Le dossier ios/ actuel reste celui généré par Expo."
fi

echo ""
echo "🚀 Process terminé avec succès."
echo "➡️  Backup : $BACKUP_FILE"
