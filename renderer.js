// Ce fichier est exécuté par la page index.html (le "renderer process").
// Il a accès aux API Node.js et peut manipuler le DOM.

window.addEventListener('DOMContentLoaded', () => {
  // Récupération des éléments de l'interface
  const generateBtn = document.getElementById('generate-btn');
  const saveBtn = document.getElementById('save-btn');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const feedRateInput = document.getElementById('feedRate');
  const laserPowerInput = document.getElementById('laserPower');
  const gcodeOutput = document.getElementById('gcode-output');

  // Désactiver le bouton de sauvegarde initialement
  saveBtn.disabled = true;

  function generateSquareGCode(width, height, feedRate, laserPower) {
    if (width <= 0 || height <= 0 || feedRate <= 0 || laserPower < 0) {
      return "Erreur : Les valeurs doivent être positives (puissance >= 0).";
    }

    // G-code commands for a simple square
    const gcode = [
      'G90 ; Positionnement absolu',
      'G21 ; Unités en millimètres',
      `G0 X0 Y0 F${feedRate * 3} ; Mouvement rapide vers l'origine`,
      '',
      '; --- Début de la gravure ---',
      `M4 S${laserPower} ; Allumer le laser`,
      `G1 X${width} Y0 F${feedRate} ; Ligne vers [${width}, 0]`,
      `G1 X${width} Y${height} ; Ligne vers [${width}, ${height}]`,
      `G1 X0 Y${height} ; Ligne vers [0, ${height}]`,
      'G1 X0 Y0 ; Ligne de retour à l'origine',
      'M5 ; Éteindre le laser',
      '; --- Fin de la gravure ---',
      '',
      `G0 X0 Y0 ; Retour rapide à l'origine`,
    ];

    return gcode.join('\n');
  }

  // Écouteur d'événement pour le bouton de génération
  generateBtn.addEventListener('click', () => {
    const width = parseFloat(widthInput.value);
    const height = parseFloat(heightInput.value);
    const feedRate = parseFloat(feedRateInput.value);
    const laserPower = parseFloat(laserPowerInput.value);

    const generatedGcode = generateSquareGCode(width, height, feedRate, laserPower);
    gcodeOutput.value = generatedGcode;

    // Activer le bouton de sauvegarde uniquement si le G-code est valide
    saveBtn.disabled = generatedGcode.startsWith('Erreur');
  });

  // Écouteur d'événement pour le bouton de sauvegarde
  saveBtn.addEventListener('click', async () => {
    const gcodeContent = gcodeOutput.value;
    if (!gcodeContent || gcodeContent.startsWith('Erreur')) {
      alert("Il n'y a pas de G-code valide à sauvegarder.");
      return;
    }

    const result = await window.electronAPI.saveGcode(gcodeContent);
    if (result.success) {
      alert(`Fichier sauvegardé avec succès à : ${result.path}`);
    } else {
      // Ne pas afficher d'alerte si l'utilisateur a simplement annulé la sauvegarde
      if(result.message && !result.message.includes('annulée')) {
        alert(`Erreur lors de la sauvegarde : ${result.message}`);
      }
    }
  });
});
