window.addEventListener('DOMContentLoaded', () => {
  // --- Récupération des éléments de l'interface ---
  const addShapeBtn = document.getElementById('add-shape-btn');
  const exportGcodeBtn = document.getElementById('export-gcode-btn');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const diameterInput = document.getElementById('diameter');
  const feedRateInput = document.getElementById('feedRate');
  const laserPowerInput = document.getElementById('laserPower');
  const shapeList = document.getElementById('shape-list');
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  const shapeRadios = document.querySelectorAll('input[name="shape"]');
  const rectangleParams = document.getElementById('rectangle-params');
  const circleParams = document.getElementById('circle-params');

  // --- Données du Projet ---
  let projectShapes = [];
  let shapeIdCounter = 0;

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
  }
  shapeRadios.forEach(radio => radio.addEventListener('change', updateVisibleParams));
  updateVisibleParams();

  // --- Fonctions de rendu ---
  function renderShapeList() {
    shapeList.innerHTML = '';
    projectShapes.forEach(shape => {
      const listItem = document.createElement('li');
      let description = `ID: ${shape.id} | `;
      if (shape.type === 'rectangle') {
        description += `Rectangle: ${shape.params.width}x${shape.params.height}mm`;
      } else if (shape.type === 'circle') {
        description += `Cercle: Ø${shape.params.diameter}mm`;
      }
      listItem.textContent = description;
      shapeList.appendChild(listItem);
    });
  }

  function renderCanvas() {
    const padding = 10.5;
    const scale = 4;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    projectShapes.forEach(shape => {
      ctx.strokeStyle = '#e44c4c';
      ctx.lineWidth = 1;
      if (shape.type === 'rectangle') {
        ctx.strokeRect(padding, padding, shape.params.width * scale, shape.params.height * scale);
      } else if (shape.type === 'circle') {
        const radius = (shape.params.diameter / 2) * scale;
        const centerX = padding + radius;
        const centerY = padding + radius;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }

  // --- Génération de G-code ---
  function getRectangleGcode(params) {
    if (params.width <= 0 || params.height <= 0) return [];
    return [
      `M4 S${params.laserPower}`,
      `G1 X${params.width} Y0 F${params.feedRate}`,
      `G1 X${params.width} Y${params.height}`,
      `G1 X0 Y${params.height}`,
      'G1 X0 Y0',
      'M5',
    ];
  }

  function getCircleGcode(params) {
    if (params.diameter <= 0) return [];
    const radius = params.diameter / 2;
    return [
      `G0 X${radius} Y0`, // Aller au point de départ
      `M4 S${params.laserPower}`,
      `G2 X${radius} Y0 I${-radius} J0 F${params.feedRate}`, // Arc complet
      'M5',
    ];
  }

  function generateProjectGCode() {
    if (projectShapes.length === 0) return '';
    let gcode = [
      'G90 ; Positionnement absolu',
      'G21 ; Unités en millimètres',
      'G0 X0 Y0 F3000; Mouvement initial',
      '; --- Début du projet ---',
    ];

    projectShapes.forEach(shape => {
      gcode.push(`\n; Forme ID: ${shape.id} - ${shape.type}`);
      let shapeGcode = [];
      if (shape.type === 'rectangle') {
        shapeGcode = getRectangleGcode(shape.params);
      } else if (shape.type === 'circle') {
        shapeGcode = getCircleGcode(shape.params);
      }
      gcode = gcode.concat(shapeGcode);
    });

    gcode.push('\n; --- Fin du projet ---');
    gcode.push('G0 X0 Y0 ; Retour final à l\'origine');
    return gcode.join('\n');
  }

  // --- Logique principale ---
  function addShape() {
    const selectedShape = document.querySelector('input[name="shape"]:checked').value;
    const commonParams = {
        feedRate: parseFloat(feedRateInput.value),
        laserPower: parseFloat(laserPowerInput.value)
    };
    const shape = { id: shapeIdCounter++, type: selectedShape, params: {} };
    if (selectedShape === 'rectangle') {
      shape.params = { width: parseFloat(widthInput.value), height: parseFloat(heightInput.value), ...commonParams };
    } else {
      shape.params = { diameter: parseFloat(diameterInput.value), ...commonParams };
    }
    projectShapes.push(shape);
    renderShapeList();
    renderCanvas();
    exportGcodeBtn.disabled = projectShapes.length === 0;
  }

  async function exportGcode() {
    const finalGcode = generateProjectGCode();
    if (!finalGcode) {
      alert("Le projet est vide. Ajoutez des formes avant d'exporter.");
      return;
    }
    const result = await window.electronAPI.saveGcode(finalGcode);
    if (result.success) {
      alert(`Fichier sauvegardé avec succès à : ${result.path}`);
    } else if (result.message && !result.message.includes('annulée')) {
      alert(`Erreur lors de la sauvegarde : ${result.message}`);
    }
  }

  // --- Écouteurs d'événements ---
  addShapeBtn.addEventListener('click', addShape);
  exportGcodeBtn.addEventListener('click', exportGcode);
  exportGcodeBtn.disabled = true;
});
