#!/usr/bin/env bash
# Publica o app do Portfólio no celular: compila, envia o código (main) e a versão pronta (gh-pages) ao GitHub.
# Uso (Git Bash, dentro desta pasta): bash publicar.sh "mensagem do que mudou"
set -e
MSG="${1:-Ajustes no app do Portfólio no celular}"
npm run build
git add -A
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "$MSG" || echo "(nada novo para commitar)"
git push origin main
TMP="$(mktemp -d)"
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"
( cd "$TMP" && git init -q -b gh-pages && git add -A \
  && git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "Publicacao: $MSG" \
  && git remote add origin https://github.com/joaokendrick3-cyber/portfolio-celular.git \
  && git push -f origin gh-pages )
rm -rf "$TMP"
echo "Publicado. O iPhone pega a versão nova ao abrir o app (pode precisar abrir duas vezes)."
