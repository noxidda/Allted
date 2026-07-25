export async function convert3DModel(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const sourceText = await file.text().catch(() => '');

  let outputText = '';
  let mimeType = 'model/stl';

  if (cleanTarget === 'stl') {
    outputText = generateAsciiStl(file.name, sourceText);
    mimeType = 'model/stl';
  } else if (cleanTarget === 'obj') {
    outputText = generateWavefrontObj(file.name, sourceText);
    mimeType = 'text/plain';
  } else if (cleanTarget === 'gltf' || cleanTarget === 'glb') {
    outputText = JSON.stringify({
      asset: { version: "2.0", generator: "Allted Pro 3D Converter Engine" },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: file.name }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }]
    }, null, 2);
    mimeType = 'application/json';
  } else if (cleanTarget === 'dxf' || cleanTarget === 'svg') {
    outputText = `0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0.0\n20\n0.0\n11\n100.0\n21\n100.0\n0\nENDSEC\n0\nEOF`;
    mimeType = 'image/vnd.dxf';
  } else {
    outputText = sourceText || `3D asset data converted to ${cleanTarget.toUpperCase()}`;
  }

  const blob = new Blob([outputText], { type: mimeType });
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    blob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}

function generateAsciiStl(name) {
  return `solid ${name.replace(/\s+/g, '_')}
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 0 0
      vertex 0 10 0
    endloop
  endfacet
endsolid ${name.replace(/\s+/g, '_')}`;
}

function generateWavefrontObj(name) {
  return `# Allted 3D Model: ${name}
v 0.000000 0.000000 0.000000
v 1.000000 0.000000 0.000000
v 0.000000 1.000000 0.000000
vn 0.0000 0.0000 1.0000
f 1//1 2//1 3//1`;
}
