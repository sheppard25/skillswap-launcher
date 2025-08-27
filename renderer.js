window.addEventListener('DOMContentLoaded', () => {
  // --- Récupération des éléments de l'interface ---
  const generateBtn = document.getElementById('generate-btn');
  const saveBtn = document.getElementById('save-btn');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const diameterInput = document.getElementById('diameter');
  const feedRateInput = document.getElementById('feedRate');
  const laserPowerInput = document.getElementById('laserPower');
  const gcodeOutput = document.getElementById('gcode-output');
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  const shapeRadios = document.querySelectorAll('input[name="shape"]');
  const rectangleParams = document.getElementById('rectangle-params');
  const circleParams = document.getElementById('circle-params');

  // --- Gestion de l'interface dynamique ---
  function updateVisibleParams() {
    const selectedShape = document.querySelector('input[name="shape"]:checked').value;
    if (selectedShape === 'circle') {
      rectangleParams.style.display = 'none';
      circleParams.style.display = 'block';
    } else {
      rectangleParams.style.display = 'block';
      circleParams.style.display = 'none';
    }
    // Effacer la toile et le gcode lors du changement de forme
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gcodeOutput.value = '';
    saveBtn.disabled = true;
  }

  shapeRadios.forEach(radio => {
    radio.addEventListener('change', updateVisibleParams);
  });
  updateVisibleParams(); // Appel initial pour définir le bon état

  // --- Prévisualisation sur la toile ---
  function drawPreview(shape, params) {
    const padding = 10.5; // .5 pour des lignes nettes
    const scale = 4; // Facteur d'échelle simple pour la visibilité
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e44c4c'; // Couleur rouge pour le tracé
    ctx.lineWidth = 1;

    if (shape === 'rectangle') {
      ctx.strokeRect(padding, padding, params.width * scale, params.height * scale);
    } else if (shape === 'circle') {
      const radius = (params.diameter / 2) * scale;
      const centerX = padding + radius;
      const centerY = padding + radius;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  // --- Génération de G-code ---
  function generateSquareGCode(width, height, feedRate, laserPower) {
    if (width <= 0 || height <= 0 || feedRate <= 0 || laserPower < 0) return "Erreur : Les valeurs doivent être positives (puissance >= 0).";
    return [
      'G90 ; Positionnement absolu', `G21 ; Unités en millimètres`, `G0 X0 Y0 F${feedRate * 3}`, ``,
      '; --- Début de la gravure ---', `M4 S${laserPower}`, `G1 X${width} Y0 F${feedRate}`,
      `G1 X${width} Y${height}`, `G1 X0 Y${height}`, 'G1 X0 Y0', 'M5 ; Éteindre le laser',
      '; --- Fin de la gravure ---', ``, `G0 X0 Y0`,
    ].join('\n');
  }

  function generateCircleGCode(diameter, feedRate, laserPower) {
    if (diameter <= 0 || feedRate <= 0 || laserPower < 0) return "Erreur : Les valeurs doivent être positives (puissance >= 0).";
    const radius = diameter / 2;
    return [
        'G90 ; Positionnement absolu', `G21 ; Unités en millimètres`, `G0 X${radius} Y0 F${feedRate * 3} ; Aller au point de départ du cercle`, ``,
        '; --- Début de la gravure ---', `M4 S${laserPower}`,
        // Arc horaire (G2) du point de départ, retour au même point, avec le centre à l'origine (I=-radius, J=0)
        `G2 X${radius} Y0 I${-radius} J0 F${feedRate}`,
        'M5 ; Éteindre le laser', '; --- Fin de la gravure ---', ``, `G0 X0 Y0 ; Retour à l'origine`,
    ].join('\n');
  }

  // --- Écouteurs d'événements principaux ---
  generateBtn.addEventListener('click', () => {
    const selectedShape = document.querySelector('input[name="shape"]:checked').value;
    const feedRate = parseFloat(feedRateInput.value);
    const laserPower = parseFloat(laserPowerInput.value);
    let generatedGcode = '';
    let params = {};

    if (selectedShape === 'rectangle') {
      params = {
        width: parseFloat(widthInput.value),
        height: parseFloat(heightInput.value),
      };
      generatedGcode = generateSquareGCode(params.width, params.height, feedRate, laserPower);
    } else { // Cercle
      params = {
        diameter: parseFloat(diameterInput.value),
      };
      generatedGcode = generateCircleGCode(params.diameter, feedRate, laserPower);
    }

    gcodeOutput.value = generatedGcode;
    const isError = generatedGcode.startsWith('Erreur');
    saveBtn.disabled = isError;

    if (!isError) {
      drawPreview(selectedShape, params);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  saveBtn.addEventListener('click', async () => {
    const gcodeContent = gcodeOutput.value;
    if (!gcodeContent || gcodeContent.startsWith('Erreur')) {
      alert("Il n'y a pas de G-code valide à sauvegarder.");
      return;
    }
    const result = await window.electronAPI.saveGcode(gcodeContent);
    if (result.success) {
      alert(`Fichier sauvegardé avec succès à : ${result.path}`);
    } else if (result.message && !result.message.includes('annulée')) {
      alert(`Erreur lors de la sauvegarde : ${result.message}`);
    }
  });
});
