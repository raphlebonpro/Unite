#!/bin/bash
set -e

npx expo export -p web

# Netlify CLI ignore les dossiers "node_modules" : on renomme celui des polices
if [ -d dist/assets/node_modules ]; then
  mv dist/assets/node_modules dist/assets/vendor
  grep -rl "assets/node_modules" dist | xargs sed -i '' 's#assets/node_modules#assets/vendor#g'
fi
# Netlify applique aussi le .gitignore : les dossiers "build" sont ignorés
POLICES="assets/vendor/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts"
if [ -d "dist/$POLICES" ]; then
  mv "dist/$POLICES" dist/assets/fonts
  grep -rl "$POLICES" dist | xargs sed -i '' "s#$POLICES#assets/fonts#g"
fi
npx netlify-cli deploy --dir=dist --prod