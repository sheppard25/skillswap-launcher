# Change directory to the script's location to ensure npm finds package.json
Set-Location -Path $PSScriptRoot

# Start logging all output to a file named install_log.txt
# Using -Force to overwrite previous logs for a clean slate
Start-Transcript -Path ".\install_log.txt" -Force

Write-Host "============================================================"
Write-Host " 1. Verification et installation des dependances (npm install)"
Write-Host "============================================================"
npm install

Write-Host "" # Newline
Write-Host "============================================================"
Write-Host " 2. Lancement de SpaceGravure (npm start)"
Write-Host "============================================================"
npm start

# The npm start command might run indefinitely.
# The transcript will stop when the script window is closed.

# The following lines might not be reached if npm start is blocking.
Write-Host "" # Newline
Write-Host "============================================================"
Write-Host " Le programme est termine."
Write-Host " Un fichier 'install_log.txt' a ete cree avec les details."
Write-Host "============================================================"

Stop-Transcript

Read-Host -Prompt "Appuyez sur Entree pour fermer cette fenetre"
