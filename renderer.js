window.addEventListener('DOMContentLoaded', () => {
  // --- Constantes ---
  const PALETTE_COLORS = {
    '00': { hex: '#000000', name: 'Noir' }, '01': { hex: '#0000FF', name: 'Bleu' },
    '02': { hex: '#FF0000', name: 'Rouge' }, '03': { hex: '#00E000', name: 'Vert' },
    '04': { hex: '#D0D000', name: 'Jaune' }, '05': { hex: '#FF8000', name: 'Orange' },
    '06': { hex: '#00E0E0', name: 'Cyan' }, '07': { hex: '#FF00FF', name: 'Magenta' },
    '08': { hex: '#B4B4B4', name: 'Gris Clair' }, '09': { hex: '#0000A0', name: 'Bleu Foncé' },
    '10': { hex: '#A00000', name: 'Rouge Foncé' }, '11': { hex: '#00A000', name: 'Vert Foncé' },
    '12': { hex: '#A0A000', name: 'Jaune Foncé' }, '13': { hex: '#C08000', name: 'Marron' },
    '14': { hex: '#00A0FF', name: 'Bleu Ciel' }, '15': { hex: '#A000A0', name: 'Violet' },
    '16': { hex: '#808080', name: 'Gris Moyen' }, '17': { hex: '#7D87B9', name: 'Bleu Lavande' },
    '18': { hex: '#BB7784', name: 'Vieux Rose' }, '19': { hex: '#4A6FE3', name: 'Bleu Royal' },
    '20': { hex: '#D33F6A', name: 'Rose Vif' }, '21': { hex: '#8CD78C', name: 'Vert Pastel' },
    '22': { hex: '#F0B98D', name: 'Pêche' }, '23': { hex: '#F6C4E1', name: 'Rose Pâle' },
    '24': { hex: '#FA9ED4', name: 'Rose Bonbon' }, '25': { hex: '#500A78', name: 'Indigo' },
    '26': { hex: '#B45A00', name: 'Ocre' }, '27': { hex: '#004754', name: 'Bleu Canard' },
    '28': { hex: '#86FA88', name: 'Vert Fluo' }, '29': { hex: '#FFDB66', name: 'Jaune Pâle' }
  };

  // --- Récupération des éléments de l'interface ---
  const addShapeBtn = document.getElementById('add-shape-btn');
  const exportGcodeBtn = document.getElementById('export-gcode-btn');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const diameterInput = document.getElementById('diameter');
  const feedRateInput = document.getElementById('feedRate');
  const laserPowerInput = document.getElementById('laserPower');
  const layerList = document.getElementById('layer-list');
  const colorPalette = document.getElementById('color-palette');
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  const shapeRadios = document.querySelectorAll('input[name="shape"]');
  const rectangleParams = document.getElementById('rectangle-params');
  const circleParams = document.getElementById('circle-params');

  // --- Données du Projet ---
  let project = { shapes: [], layers: {} };
  let shapeIdCounter = 0;
  let activeLayer = '00';

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

  // --- Initialisation & Rendu ---
  function populatePalette() {
    for (const layerIndex in PALETTE_COLORS) {
      const swatch = document.createElement('div');
      swatch.classList.add('color-swatch');
      swatch.style.backgroundColor = PALETTE_COLORS[layerIndex].hex;
      swatch.dataset.layerIndex = layerIndex;
      if (layerIndex === activeLayer) swatch.classList.add('active');
      swatch.addEventListener('click', () => {
        activeLayer = layerIndex;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
      colorPalette.appendChild(swatch);
    }
  }

  function renderLayerList() {
    layerList.innerHTML = '';
    for (const layerIndex in project.layers) {
      const layer = project.layers[layerIndex];
      const layerDiv = document.createElement('div');
      layerDiv.className = 'layer-item';
      // Remplacer les spans par des inputs pour l'édition
      layerDiv.innerHTML = `
        <div class="layer-color" style="background-color: ${layer.color}"></div>
        <span>${PALETTE_COLORS[layerIndex].name}</span>
        <label>V: <input type="number" class="layer-input" data-layer-index="${layerIndex}" data-property="speed" value="${layer.speed}"></label>
        <label>P: <input type="number" class="layer-input" data-layer-index="${layerIndex}" data-property="power" value="${layer.power}"></label>
      `;
      layerList.appendChild(layerDiv);
    }
  }

  function renderCanvas() {
    const padding = 10.5;
    const scale = 4;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    project.shapes.forEach(shape => {
      const layer = project.layers[shape.layerIndex];
      ctx.strokeStyle = layer.color;
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
    return [`G1 X${params.width} Y0`, `G1 X${params.width} Y${params.height}`, `G1 X0 Y${params.height}`, 'G1 X0 Y0'];
  }

  function getCircleGcode(params) {
    const radius = params.diameter / 2;
    return [`G0 X${radius} Y0`, `G2 X${radius} Y0 I${-radius} J0`];
  }

  function generateProjectGCode() {
    if (project.shapes.length === 0) return '';
    let gcode = ['G90', 'G21', '; --- Début du projet ---'];

    // Group shapes by layer
    const shapesByLayer = {};
    project.shapes.forEach(shape => {
      if (!shapesByLayer[shape.layerIndex]) {
        shapesByLayer[shape.layerIndex] = [];
      }
      shapesByLayer[shape.layerIndex].push(shape);
    });

    for (const layerIndex in shapesByLayer) {
      const layer = project.layers[layerIndex];
      gcode.push(`\n; Calque ${layerIndex} - Vitesse: ${layer.speed}, Puissance: ${layer.power}`);
      gcode.push(`M4 S${layer.power}`);

      shapesByLayer[layerIndex].forEach(shape => {
        let shapeGcode = [];
        if (shape.type === 'rectangle') {
          shapeGcode = getRectangleGcode(shape.params);
        } else if (shape.type === 'circle') {
          shapeGcode = getCircleGcode(shape.params);
        }
        // Add feed rate to all G1/G2/G3 moves
        shapeGcode = shapeGcode.map(line => line.startsWith('G1') || line.startsWith('G2') || line.startsWith('G3') ? `${line} F${layer.speed}` : line);
        gcode = gcode.concat(shapeGcode);
      });
      gcode.push('M5 ; Fin du calque, laser éteint');
    }

    gcode.push('\n; --- Fin du projet ---', 'G0 X0 Y0');
    return gcode.join('\n');
  }

  // --- Logique principale ---
  function addShape() {
    if (!project.layers[activeLayer]) {
      project.layers[activeLayer] = {
        speed: parseFloat(feedRateInput.value),
        power: parseFloat(laserPowerInput.value),
        color: PALETTE_COLORS[activeLayer].hex
      };
    }
    const shape = { id: shapeIdCounter++, type: document.querySelector('input[name="shape"]:checked').value, layerIndex: activeLayer, params: {} };
    if (shape.type === 'rectangle') {
      shape.params = { width: parseFloat(widthInput.value), height: parseFloat(heightInput.value) };
    } else {
      shape.params = { diameter: parseFloat(diameterInput.value) };
    }
    project.shapes.push(shape);
    renderLayerList();
    renderCanvas();
    exportGcodeBtn.disabled = project.shapes.length === 0;
  }

  async function exportGcode() {
    const finalGcode = generateProjectGCode();
    if (!finalGcode) {
      alert("Projet vide.");
      return;
    }
    const result = await window.electronAPI.saveGcode(finalGcode);
    if (result.success) {
      alert(`Fichier sauvegardé: ${result.path}`);
    } else if (result.message && !result.message.includes('annulée')) {
      alert(`Erreur: ${result.message}`);
    }
  }

  // --- Initialisation ---
  updateVisibleParams();
  populatePalette();
  addShapeBtn.addEventListener('click', addShape);
  exportGcodeBtn.addEventListener('click', exportGcode);
  exportGcodeBtn.disabled = true;

  layerList.addEventListener('input', (e) => {
    if (e.target.classList.contains('layer-input')) {
      const layerIndex = e.target.dataset.layerIndex;
      const property = e.target.dataset.property;
      const value = parseFloat(e.target.value);

      if (project.layers[layerIndex] && !isNaN(value)) {
        project.layers[layerIndex][property] = value;
        console.log(`Updated layer ${layerIndex}:`, project.layers[layerIndex]);
      }
    }
  });
});
