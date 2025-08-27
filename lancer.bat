@echo off
:: Change directory to the script's location to ensure npm finds package.json
cd /d "%~dp0"

echo ============================================================
echo  1. Verification et installation des dependances (npm install)
echo ============================================================
npm install

echo.
echo ============================================================
echo  2. Lancement de SpaceGravure (npm start)
echo ============================================================
npm start

echo.
echo ============================================================
echo  Le programme est termine.
echo  S'il y a eu une erreur, elle devrait etre visible ci-dessus.
echo  Appuyez sur n'importe quelle touche pour fermer cette fenetre.
echo ============================================================
pause
