// Ce fichier est exécuté par la page index.html (le "renderer process").
// Il a accès aux API Node.js et peut manipuler le DOM.

window.addEventListener('DOMContentLoaded', () => {
  // Récupération des éléments de l'interface
  const generateBtn = document.getElementById('generate-btn');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const gcodeOutput = document.getElementById('gcode-output');

  function generateSquareGCode(width, height) {
    if (width <= 0 || height <= 0) {
      return "Erreur : La largeur et la hauteur doivent être des nombres positifs.";
    }

    // G-code commands for a simple square
    const gcode = [
      'G90 ; Positionnement absolu',
      'G21 ; Unités en millimètres',
      'G0 X0 Y0 F3000 ; Mouvement rapide vers l\'origine',
      '',
      '; --- Début de la gravure ---',
      'M4 S1000 ; Allumer le laser (la puissance S1000 est une convention)',
      `G1 X${width} Y0 F1000 ; Ligne vers [${width}, 0]`,
      `G1 X${width} Y${height} ; Ligne vers [${width}, ${height}]`,
      `G1 X0 Y${height} ; Ligne vers [0, ${height}]`,
      'G1 X0 Y0 ; Ligne de retour à l\'origine',
      'M5 ; Éteindre le laser',
      '; --- Fin de la gravure ---',
      '',
      'G0 X0 Y0 ; Retour rapide à l\'origine',
    ];

    return gcode.join('\n');
  }

  // Ajout de l'écouteur d'événement sur le bouton
  generateBtn.addEventListener('click', () => {
    const width = parseFloat(widthInput.value);
    const height = parseFloat(heightInput.value);

    const generatedGcode = generateSquareGCode(width, height);
    gcodeOutput.value = generatedGcode;
  });
});
