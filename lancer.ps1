# Change directory to the script's location to ensure npm finds package.json
Set-Location -Path $PSScriptRoot

Write-Host "============================================================"
Write-Host " 1. Verification et installation des dependances (npm install)"
Write-Host "============================================================"
npm install

Write-Host "" # Newline
Write-Host "============================================================"
Write-Host " 2. Lancement de SpaceGravure (npm start)"
Write-Host "============================================================"
npm start

Write-Host "" # Newline
Write-Host "============================================================"
Write-Host " Le programme est termine."
Write-Host " S'il y a eu une erreur, elle devrait etre visible ci-dessus."
Write-Host "============================================================"
Read-Host -Prompt "Appuyez sur Entree pour fermer cette fenetre"
