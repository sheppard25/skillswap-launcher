window.addEventListener('DOMContentLoaded', () => {
  // --- Constantes ---
  const PALETTE_DATA = [
    { index: '00', hex: '#000000', name: 'Noir' }, { index: '01', hex: '#0000FF', name: 'Bleu' },
    { index: '02', hex: '#FF0000', name: 'Rouge' }, { index: '03', hex: '#00E000', name: 'Vert' },
    { index: '04', hex: '#D0D000', name: 'Jaune' }, { index: '05', hex: '#FF8000', name: 'Orange' },
    { index: '06', hex: '#00E0E0', name: 'Cyan' }, { index: '07', hex: '#FF00FF', name: 'Magenta' },
    { index: '08', hex: '#B4B4B4', name: 'Gris Clair' }, { index: '09', hex: '#0000A0', name: 'Bleu Foncé' },
    { index: '10', hex: '#A00000', name: 'Rouge Foncé' }, { index: '11', hex: '#00A000', name: 'Vert Foncé' },
    { index: '12', hex: '#A0A000', name: 'Jaune Foncé' }, { index: '13', hex: '#C08000', name: 'Marron' },
    { index: '14', hex: '#00A0FF', name: 'Bleu Ciel' }, { index: '15', hex: '#A000A0', name: 'Violet' },
    { index: '16', hex: '#808080', name: 'Gris Moyen' }, { index: '17', hex: '#7D87B9', name: 'Bleu Lavande' },
    { index: '18', hex: '#BB7784', name: 'Vieux Rose' }, { index: '19', hex: '#4A6FE3', name: 'Bleu Royal' },
    { index: '20', hex: '#D33F6A', name: 'Rose Vif' }, { index: '21', hex: '#8CD78C', name: 'Vert Pastel' },
    { index: '22', hex: '#F0B98D', name: 'Pêche' }, { index: '23', hex: '#F6C4E1', name: 'Rose Pâle' },
    { index: '24', hex: '#FA9ED4', name: 'Rose Bonbon' }, { index: '25', hex: '#500A78', name: 'Indigo' },
    { index: '26', hex: '#B45A00', name: 'Ocre' }, { index: '27', hex: '#004754', name: 'Bleu Canard' },
    { index: '28', hex: '#86FA88', name: 'Vert Fluo' }, { index: '29', hex: '#FFDB66', name: 'Jaune Pâle' },
    { index: 'T1', hex: '#F36926', name: 'Outil 1' }, { index: 'T2', hex: '#0C96D9', name: 'Outil 2' }
  ];
  const RULER_SIZE = 30;
  const GRID_INTERVAL = 10;
  const WORKSPACE_UNITS = 300;
  const WORKSPACE_SVG_WIDTH = 600;
  const WORKSPACE_SVG_HEIGHT = 600;
  const CANVAS_WIDTH = WORKSPACE_SVG_WIDTH + RULER_SIZE;
  const CANVAS_HEIGHT = WORKSPACE_SVG_HEIGHT + RULER_SIZE;
  const RENDER_SCALE = WORKSPACE_SVG_WIDTH / WORKSPACE_UNITS;

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
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // --- Données du Projet & État de l'UI ---
  let project = { shapes: [], layers: {} };
  let shapeIdCounter = 0;
  let activeLayer = '00';
  let selectedShapeId = null;

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

  function updateSelectionProperties() {
    const selectedShape = project.shapes.find(s => s.id === selectedShapeId);
    if (!selectedShape) return;
    document.querySelector(`input[name="shape"][value="${selectedShape.type}"]`).checked = true;
    updateVisibleParams();
    if (selectedShape.type === 'rectangle') {
      widthInput.value = selectedShape.params.width;
      heightInput.value = selectedShape.params.height;
    } else if (selectedShape.type === 'circle') {
      diameterInput.value = selectedShape.params.diameter;
    }
    const layer = project.layers[selectedShape.layerIndex];
    if (layer) {
      feedRateInput.value = layer.speed;
      laserPowerInput.value = layer.power;
    }
    activeLayer = selectedShape.layerIndex;
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.layerIndex === activeLayer);
    });
  }

  // --- Initialisation & Rendu ---
  function populatePalette() {
    PALETTE_DATA.forEach(colorData => {
      const swatch = document.createElement('div');
      swatch.classList.add('color-swatch');
      swatch.style.backgroundColor = colorData.hex;
      swatch.dataset.layerIndex = colorData.index;
      swatch.textContent = colorData.index;
      if (colorData.index === activeLayer) swatch.classList.add('active');
      swatch.addEventListener('click', () => {
        activeLayer = colorData.index;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
      colorPalette.appendChild(swatch);
    });
  }

  function renderLayerList() {
    layerList.innerHTML = '';
    Object.keys(project.layers).sort().forEach(layerIndex => {
      const layer = project.layers[layerIndex];
      const colorData = PALETTE_DATA.find(p => p.index === layerIndex) || { name: 'Inconnu' };
      const layerDiv = document.createElement('div');
      layerDiv.className = 'layer-item';
      const isToolLayer = layerIndex === 'T1' || layerIndex === 'T2';
      const intervalInputDisplay = layer.mode === 'fill' && !isToolLayer ? 'inline-block' : 'none';
      layerDiv.innerHTML = `
        <div class="layer-color" style="background-color: ${layer.color}"></div>
        <div class="layer-details">
          <span>${colorData.name}</span>
          ${isToolLayer ? '<span>(Outil)</span>' : `
          <div>
            <label>V: <input type="number" class="layer-input" data-layer-index="${layerIndex}" data-property="speed" value="${layer.speed}"></label>
            <label>P: <input type="number" class="layer-input" data-layer-index="${layerIndex}" data-property="power" value="${layer.power}"></label>
          </div>
          <div>
            <label>Mode:
              <select class="layer-input" data-layer-index="${layerIndex}" data-property="mode">
                <option value="line" ${layer.mode === 'line' ? 'selected' : ''}>Ligne</option>
                <option value="fill" ${layer.mode === 'fill' ? 'selected' : ''}>Remplissage</option>
                <option value="fill+line" ${layer.mode === 'fill+line' ? 'selected' : ''}>Remplissage+Ligne</option>
              </select>
            </label>
            <label style="display: ${intervalInputDisplay};" class="interval-label">Int: <input type="number" step="0.1" class="layer-input" data-layer-index="${layerIndex}" data-property="lineInterval" value="${layer.lineInterval}"></label>
          </div>
          `}
        </div>
      `;
      layerList.appendChild(layerDiv);
    });
  }

  function drawGrid() {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= WORKSPACE_UNITS; x += GRID_INTERVAL) {
      const xPos = x * RENDER_SCALE;
      ctx.beginPath();
      ctx.moveTo(xPos, RULER_SIZE);
      ctx.lineTo(xPos, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= WORKSPACE_UNITS; y += GRID_INTERVAL) {
      const yPos = RULER_SIZE + y * RENDER_SCALE;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(WORKSPACE_SVG_WIDTH, yPos);
      ctx.stroke();
    }
  }

  function drawRulers() {
    ctx.fillStyle = '#3c4049';
    ctx.fillRect(0, 0, WORKSPACE_SVG_WIDTH, RULER_SIZE); // Top ruler
    ctx.fillRect(WORKSPACE_SVG_WIDTH, 0, RULER_SIZE, CANVAS_HEIGHT); // Right ruler

    ctx.strokeStyle = '#abb2bf';
    ctx.fillStyle = '#abb2bf';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top ruler (0 is on the right)
    for (let i = 0; i <= WORKSPACE_UNITS / GRID_INTERVAL; i++) {
        const unit = i * GRID_INTERVAL;
        if (unit % 20 === 0) {
            const xPos = WORKSPACE_SVG_WIDTH - (unit * RENDER_SCALE);
            ctx.beginPath();
            ctx.moveTo(xPos, RULER_SIZE);
            ctx.lineTo(xPos, 0);
            ctx.stroke();
            if (unit < WORKSPACE_UNITS) ctx.fillText(unit, xPos, RULER_SIZE / 2);
        }
    }
    // Right ruler (0 is at the top)
    for (let i = 0; i <= WORKSPACE_UNITS / GRID_INTERVAL; i++) {
        const unit = i * GRID_INTERVAL;
        if (unit % 20 === 0) {
            const yPos = RULER_SIZE + unit * RENDER_SCALE;
            ctx.beginPath();
            ctx.moveTo(WORKSPACE_SVG_WIDTH, yPos);
            ctx.lineTo(WORKSPACE_SVG_WIDTH + 10, yPos);
            ctx.stroke();
            if (unit > 0) ctx.fillText(unit, WORKSPACE_SVG_WIDTH + RULER_SIZE / 2, yPos);
        }
    }
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Workspace background
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, RULER_SIZE, WORKSPACE_SVG_WIDTH, WORKSPACE_SVG_HEIGHT);

    drawGrid();

    project.shapes.forEach(shape => {
      const layer = project.layers[shape.layerIndex];
      if (!layer) return;

      const offsetX = 0; // Origin is now top-left of workspace area
      const offsetY = RULER_SIZE;

      ctx.strokeStyle = layer.color;
      ctx.lineWidth = (shape.id === selectedShapeId) ? 2 : 1;

      const workAreaWidth = WORKSPACE_SVG_WIDTH;

      if (shape.type === 'rectangle') {
        const shapeWidth = shape.params.width * RENDER_SCALE;
        const shapeHeight = shape.params.height * RENDER_SCALE;
        const x = offsetX + workAreaWidth - shapeWidth; // Inverted X
        const y = offsetY;
        if(layer.mode === 'fill' || layer.mode === 'fill+line') {
            ctx.fillStyle = layer.color + '40';
            ctx.fillRect(x, y, shapeWidth, shapeHeight);
        }
        ctx.strokeRect(x, y, shapeWidth, shapeHeight);
      } else if (shape.type === 'circle') {
        const radius = (shape.params.diameter / 2) * RENDER_SCALE;
        const centerX = offsetX + workAreaWidth - radius; // Inverted X
        const centerY = offsetY + radius;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        if(layer.mode === 'fill' || layer.mode === 'fill+line') {
            ctx.fillStyle = layer.color + '40';
            ctx.fill();
        }
        ctx.stroke();
      }
    });

    drawRulers();
  }

  // --- Logique de Sélection ---
  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  function isPointInShape(point, shape) {
    const offsetX = 0;
    const offsetY = RULER_SIZE;
    const workAreaWidth = WORKSPACE_SVG_WIDTH;

    if (shape.type === 'rectangle') {
      const shapeWidth = shape.params.width * RENDER_SCALE;
      const shapeHeight = shape.params.height * RENDER_SCALE;
      const x1 = offsetX + workAreaWidth - shapeWidth;
      const y1 = offsetY;
      return point.x >= x1 && point.x <= x1 + shapeWidth && point.y >= y1 && point.y <= y1 + shapeHeight;
    } else if (shape.type === 'circle') {
      const radius = (shape.params.diameter / 2) * RENDER_SCALE;
      const centerX = offsetX + workAreaWidth - radius;
      const centerY = offsetY + radius;
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      return (dx * dx + dy * dy) <= (radius * radius);
    }
    return false;
  }

  function handleCanvasClick(event) {
    const mousePos = getMousePos(canvas, event);
    let foundShape = false;
    for (let i = project.shapes.length - 1; i >= 0; i--) {
      const shape = project.shapes[i];
      if (isPointInShape(mousePos, shape)) {
        selectedShapeId = shape.id;
        foundShape = true;
        break;
      }
    }
    if (!foundShape) selectedShapeId = null;
    renderCanvas();
    updateSelectionProperties();
  }

  // --- Génération de G-code ---
  function getLineGcode(shape) {
    if (shape.type === 'rectangle') return [`G1 X${shape.params.width} Y0`, `G1 X${shape.params.width} Y${shape.params.height}`, `G1 X0 Y${shape.params.height}`, 'G1 X0 Y0'];
    if (shape.type === 'circle') {
        const radius = shape.params.diameter / 2;
        return [`G0 X${radius} Y0`, `G2 X${radius} Y0 I${-radius} J0`];
    }
    return [];
  }

  function getFillGcode(shape) {
    if (shape.type !== 'rectangle') return ['G1 X0 Y0 ; Remplissage non supporté'];
    const { width, height } = shape.params;
    const lineInterval = project.layers[shape.layerIndex].lineInterval;
    const gcode = [];
    let y = 0;
    while (y <= height) {
      gcode.push( (y === 0 ? 'G0' : 'G1') + ` X0 Y${y}`);
      gcode.push(`G1 X${width} Y${y}`);
      y += lineInterval;
      if (y > height) break;
      gcode.push(`G1 X${width} Y${y}`);
      gcode.push(`G1 X0 Y${y}`);
      y += lineInterval;
    }
    return gcode;
  }

  function generateProjectGCode() {
    const outputShapes = project.shapes.filter(s => s.layerIndex !== 'T1' && s.layerIndex !== 'T2');
    if (outputShapes.length === 0) return '';
    let gcode = ['G90', 'G21', '; --- Début du projet ---'];
    const shapesByLayer = {};
    outputShapes.forEach(s => { (shapesByLayer[s.layerIndex] = shapesByLayer[s.layerIndex] || []).push(s); });
    Object.keys(shapesByLayer).sort().forEach(layerIndex => {
      const layer = project.layers[layerIndex];
      gcode.push(`\n; Calque ${layerIndex} - Mode: ${layer.mode}, V: ${layer.speed}, P: ${layer.power}`);
      gcode.push(`M4 S${layer.power}`);
      shapesByLayer[layerIndex].forEach(shape => {
        let shapeGcode = [];
        if (layer.mode === 'line') shapeGcode = getLineGcode(shape);
        else if (layer.mode === 'fill') shapeGcode = getFillGcode(shape);
        else if (layer.mode === 'fill+line') shapeGcode = getFillGcode(shape).concat(getLineGcode(shape));
        shapeGcode = shapeGcode.map(line => (line.startsWith('G1') || line.startsWith('G2') || line.startsWith('G3')) ? `${line} F${layer.speed}` : line);
        gcode = gcode.concat(shapeGcode);
      });
      gcode.push('M5 ; Fin du calque');
    });
    gcode.push('\n; --- Fin du projet ---', 'G0 X0 Y0');
    return gcode.join('\n');
  }

  // --- Logique principale ---
  function addShape() {
    if (!project.layers[activeLayer]) {
      project.layers[activeLayer] = {
        speed: parseFloat(feedRateInput.value), power: parseFloat(laserPowerInput.value),
        mode: 'line', lineInterval: 0.5, color: PALETTE_DATA.find(p => p.index === activeLayer).hex
      };
    }
    const shape = { id: shapeIdCounter++, type: document.querySelector('input[name="shape"]:checked').value, layerIndex: activeLayer, params: {} };
    if (shape.type === 'rectangle') shape.params = { width: parseFloat(widthInput.value), height: parseFloat(heightInput.value) };
    else shape.params = { diameter: parseFloat(diameterInput.value) };
    project.shapes.push(shape);
    selectedShapeId = shape.id;
    renderLayerList();
    renderCanvas();
    updateSelectionProperties();
    exportGcodeBtn.disabled = project.shapes.length === 0;
  }

  async function exportGcode() {
    const finalGcode = generateProjectGCode();
    if (!finalGcode) { alert("Projet vide."); return; }
    const result = await window.electronAPI.saveGcode(finalGcode);
    if (result.success) alert(`Fichier sauvegardé: ${result.path}`);
    else if (result.message && !result.message.includes('annulée')) alert(`Erreur: ${result.message}`);
  }

  // --- Initialisation et Écouteurs ---
  updateVisibleParams();
  populatePalette();
  addShapeBtn.addEventListener('click', addShape);
  exportGcodeBtn.addEventListener('click', exportGcode);
  exportGcodeBtn.disabled = true;
  layerList.addEventListener('input', (e) => {
    if (e.target.classList.contains('layer-input')) {
      const layerIndex = e.target.dataset.layerIndex;
      const property = e.target.dataset.property;
      const value = e.target.tagName === 'SELECT' ? e.target.value : parseFloat(e.target.value);
      if (project.layers[layerIndex]) {
        project.layers[layerIndex][property] = value;
        renderLayerList();
      }
    }
  });
  canvas.addEventListener('click', handleCanvasClick);
  renderCanvas();
});
