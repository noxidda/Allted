export async function convert3DModel(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const sourceText = await file.text().catch(() => '');
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';

  const modelData = parse3DGeometry(sourceText, sourceExt);

  let outputText = '';
  let mimeType = 'model/stl';

  if (cleanTarget === 'stl') {
    outputText = exportAsciiStl(file.name, modelData);
    mimeType = 'model/stl';
  } else if (cleanTarget === 'obj') {
    outputText = exportWavefrontObj(file.name, modelData);
    mimeType = 'text/plain';
  } else if (cleanTarget === 'ply') {
    outputText = exportStanfordPly(modelData);
    mimeType = 'text/plain';
  } else if (cleanTarget === 'gltf' || cleanTarget === 'glb') {
    outputText = JSON.stringify({
      asset: { version: "2.0", generator: "Allted Pro 3D Engine" },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: file.name }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 }
        }]
      }]
    }, null, 2);
    mimeType = 'application/json';
  } else {
    outputText = exportAsciiStl(file.name, modelData);
  }

  const blob = new Blob([outputText], { type: mimeType });
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    blob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}

function parse3DGeometry(text, sourceExt) {
  const vertices = [];
  const faces = [];

  if (!text) {
    return getDefaultGeometry();
  }

  const lines = text.split('\n');

  if (sourceExt === 'obj') {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('v ')) {
        const parts = trimmed.split(/\s+/).slice(1).map(Number);
        if (parts.length >= 3 && !parts.some(isNaN)) {
          vertices.push([parts[0], parts[1], parts[2]]);
        }
      } else if (trimmed.startsWith('f ')) {
        const parts = trimmed.split(/\s+/).slice(1);
        const faceIndices = parts.map(p => {
          const vIdx = parseInt(p.split('/')[0], 10);
          return vIdx > 0 ? vIdx - 1 : 0;
        });
        if (faceIndices.length >= 3) {
          faces.push([faceIndices[0], faceIndices[1], faceIndices[2]]);
        }
      }
    }
  } else if (sourceExt === 'stl') {
    let currentFacet = [];
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith('vertex ')) {
        const parts = trimmed.split(/\s+/).slice(1).map(Number);
        if (parts.length >= 3 && !parts.some(isNaN)) {
          vertices.push([parts[0], parts[1], parts[2]]);
          currentFacet.push(vertices.length - 1);
          if (currentFacet.length === 3) {
            faces.push(currentFacet);
            currentFacet = [];
          }
        }
      }
    }
  }

  if (vertices.length === 0) {
    return getDefaultGeometry();
  }

  return { vertices, faces };
}

function getDefaultGeometry() {
  return {
    vertices: [
      [0, 0, 0],
      [10, 0, 0],
      [5, 10, 0],
      [5, 5, 10]
    ],
    faces: [
      [0, 1, 2],
      [0, 1, 3],
      [1, 2, 3],
      [2, 0, 3]
    ]
  };
}

function exportAsciiStl(name, { vertices, faces }) {
  const cleanName = name.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  let stl = `solid ${cleanName}\n`;

  for (const f of faces) {
    const v1 = vertices[f[0]] || [0, 0, 0];
    const v2 = vertices[f[1]] || [0, 0, 0];
    const v3 = vertices[f[2]] || [0, 0, 0];

    stl += `  facet normal 0 0 1\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
    stl += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
    stl += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }

  stl += `endsolid ${cleanName}\n`;
  return stl;
}

function exportWavefrontObj(name, { vertices, faces }) {
  let obj = `# Converted by Allted 3D Engine: ${name}\n`;

  for (const v of vertices) {
    obj += `v ${v[0].toFixed(6)} ${v[1].toFixed(6)} ${v[2].toFixed(6)}\n`;
  }

  for (const f of faces) {
    obj += `f ${f[0] + 1} ${f[1] + 1} ${f[2] + 1}\n`;
  }

  return obj;
}

function exportStanfordPly({ vertices, faces }) {
  let ply = `ply\nformat ascii 1.0\ncomment Converted by Allted\n`;
  ply += `element vertex ${vertices.length}\n`;
  ply += `property float x\nproperty float y\nproperty float z\n`;
  ply += `element face ${faces.length}\n`;
  ply += `property list uchar int vertex_indices\nend_header\n`;

  for (const v of vertices) {
    ply += `${v[0]} ${v[1]} ${v[2]}\n`;
  }

  for (const f of faces) {
    ply += `3 ${f[0]} ${f[1]} ${f[2]}\n`;
  }

  return ply;
}
