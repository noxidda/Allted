export const CATEGORIES = [
  { id: 'word', label: 'Documents', description: 'DOCX, PDF, ODT, RTF, MD, HTML, TXT, DOC, PPT, PPTX' },
  { id: 'audio', label: 'Audio', description: 'MP3, WAV, FLAC, AAC, M4A, OGG, OPUS, ALAC, AIFF' },
  { id: 'video', label: 'Video', description: 'MP4, MKV, MOV, AVI, WEBM, GIF, SRT, VTT, ASS, SSA, SUB' },
  { id: 'image', label: 'Images', description: 'JPG, PNG, WEBP, SVG, HEIC, AVIF, GIF, BMP, TIFF, EPS, AI' },
  { id: 'spreadsheet', label: 'Data & Spreadsheets', description: 'XLSX, XLS, ODS, CSV, TSV, JSON, XML, YAML, TOML, INI' },
  { id: 'archive', label: 'Archives', description: 'ZIP, 7Z, TAR, TAR.GZ, TAR.XZ, RAR, GZ' },
  { id: 'model3d', label: '3D Models & CAD', description: 'OBJ, STL, FBX, GLTF, GLB, PLY, DWG, DXF, STEP, IGES' },
  { id: 'ocr', label: 'E-Books & OCR', description: 'EPUB, MOBI, AZW3, Scanned Image/PDF OCR' },
];

export const CATEGORY_ACCEPT_MAP = {
  word: '.doc,.docx,.odt,.rtf,.txt,.html,.md,.pdf,.ppt,.pptx,.odp',
  audio: 'audio/*,.mp3,.wav,.flac,.aac,.m4a,.ogg,.opus,.alac,.aiff',
  video: 'video/*,.mp4,.mkv,.mov,.avi,.webm',
  image: 'image/*,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.gif,.svg,.heic,.avif',
  spreadsheet: '.xls,.xlsx,.ods,.csv,.tsv,.json,.xml,.yaml,.toml,.ini',
  archive: '.zip,.7z,.tar,.tar.gz,.tar.xz,.rar,.gz',
  model3d: '.obj,.stl,.fbx,.gltf,.glb,.ply,.dwg,.dxf',
  ocr: '.epub,.mobi,.azw3,.pdf,.txt,.docx',
};

export const FORMAT_OPTIONS = {
  // Documents
  doc: { ext: 'doc', name: 'Word Document (Legacy)', category: 'word' },
  docx: { ext: 'docx', name: 'Word Document', category: 'word' },
  odt: { ext: 'odt', name: 'OpenDocument Text', category: 'word' },
  rtf: { ext: 'rtf', name: 'Rich Text Format', category: 'word' },
  txt: { ext: 'txt', name: 'Plain Text', category: 'word' },
  html: { ext: 'html', name: 'HTML Web Page', category: 'word' },
  md: { ext: 'md', name: 'Markdown Document', category: 'word' },
  pdf: { ext: 'pdf', name: 'PDF Document', category: 'word' },
  ppt: { ext: 'ppt', name: 'PowerPoint (Legacy)', category: 'word' },
  pptx: { ext: 'pptx', name: 'PowerPoint Presentation', category: 'word' },
  odp: { ext: 'odp', name: 'OpenDocument Presentation', category: 'word' },

  // Audio
  mp3: { ext: 'mp3', name: 'MP3 Audio', category: 'audio' },
  aac: { ext: 'aac', name: 'AAC Audio', category: 'audio' },
  m4a: { ext: 'm4a', name: 'M4A Audio', category: 'audio' },
  ogg: { ext: 'ogg', name: 'OGG Vorbis Audio', category: 'audio' },
  opus: { ext: 'opus', name: 'OPUS Audio', category: 'audio' },
  flac: { ext: 'flac', name: 'FLAC Lossless Audio', category: 'audio' },
  wav: { ext: 'wav', name: 'WAVE Audio', category: 'audio' },
  alac: { ext: 'alac', name: 'Apple Lossless Audio', category: 'audio' },
  aiff: { ext: 'aiff', name: 'AIFF Audio', category: 'audio' },

  // Video & Subtitles
  mp4: { ext: 'mp4', name: 'MP4 Video', category: 'video' },
  mkv: { ext: 'mkv', name: 'Matroska Video', category: 'video' },
  mov: { ext: 'mov', name: 'QuickTime Video', category: 'video' },
  avi: { ext: 'avi', name: 'AVI Video', category: 'video' },
  webm: { ext: 'webm', name: 'WebM Video', category: 'video' },
  srt: { ext: 'srt', name: 'SubRip Subtitles', category: 'video' },
  vtt: { ext: 'vtt', name: 'WebVTT Subtitles', category: 'video' },
  ass: { ext: 'ass', name: 'SubStation Alpha', category: 'video' },
  ssa: { ext: 'ssa', name: 'SubStation Alpha (SSA)', category: 'video' },
  sub: { ext: 'sub', name: 'MicroDVD Subtitles', category: 'video' },

  // Images
  jpg: { ext: 'jpg', name: 'JPEG Image', category: 'image' },
  jpeg: { ext: 'jpeg', name: 'JPEG Image', category: 'image' },
  png: { ext: 'png', name: 'PNG Image', category: 'image' },
  webp: { ext: 'webp', name: 'WebP Image', category: 'image' },
  bmp: { ext: 'bmp', name: 'Bitmap Image', category: 'image' },
  tiff: { ext: 'tiff', name: 'TIFF Image', category: 'image' },
  heic: { ext: 'heic', name: 'HEIC Image', category: 'image' },
  avif: { ext: 'avif', name: 'AVIF Image', category: 'image' },
  gif: { ext: 'gif', name: 'Animated GIF', category: 'image' },
  svg: { ext: 'svg', name: 'Scalable Vector Graphics', category: 'image' },
  eps: { ext: 'eps', name: 'Encapsulated PostScript', category: 'image' },
  ai: { ext: 'ai', name: 'Adobe Illustrator Artwork', category: 'image' },

  // Spreadsheets & Data
  xls: { ext: 'xls', name: 'Excel 97-2003 Workbook', category: 'spreadsheet' },
  xlsx: { ext: 'xlsx', name: 'Excel Workbook', category: 'spreadsheet' },
  ods: { ext: 'ods', name: 'OpenDocument Spreadsheet', category: 'spreadsheet' },
  csv: { ext: 'csv', name: 'Comma Separated Values', category: 'spreadsheet' },
  tsv: { ext: 'tsv', name: 'Tab Separated Values', category: 'spreadsheet' },
  json: { ext: 'json', name: 'JSON Data', category: 'spreadsheet' },
  xml: { ext: 'xml', name: 'XML Document', category: 'spreadsheet' },
  yaml: { ext: 'yaml', name: 'YAML Document', category: 'spreadsheet' },
  toml: { ext: 'toml', name: 'TOML Document', category: 'spreadsheet' },
  ini: { ext: 'ini', name: 'INI Configuration', category: 'spreadsheet' },

  // Archives
  zip: { ext: 'zip', name: 'ZIP Archive', category: 'archive' },
  '7z': { ext: '7z', name: '7-Zip Archive', category: 'archive' },
  tar: { ext: 'tar', name: 'TAR Archive', category: 'archive' },
  'tar.gz': { ext: 'tar.gz', name: 'Compressed TAR (GZ)', category: 'archive' },
  'tar.xz': { ext: 'tar.xz', name: 'Compressed TAR (XZ)', category: 'archive' },
  rar: { ext: 'rar', name: 'RAR Archive', category: 'archive' },
  gz: { ext: 'gz', name: 'GZip File', category: 'archive' },

  // 3D & CAD
  obj: { ext: 'obj', name: 'Wavefront 3D Object', category: 'model3d' },
  stl: { ext: 'stl', name: 'Stereolithography 3D', category: 'model3d' },
  fbx: { ext: 'fbx', name: 'Filmbox 3D Asset', category: 'model3d' },
  gltf: { ext: 'gltf', name: 'glTF 3D Scene', category: 'model3d' },
  glb: { ext: 'glb', name: 'Binary glTF 3D', category: 'model3d' },
  ply: { ext: 'ply', name: 'Polygon File Format', category: 'model3d' },
  dwg: { ext: 'dwg', name: 'AutoCAD Drawing', category: 'model3d' },
  dxf: { ext: 'dxf', name: 'Drawing Exchange Format', category: 'model3d' },

  // E-Books & OCR
  epub: { ext: 'epub', name: 'EPUB E-Book', category: 'ocr' },
  mobi: { ext: 'mobi', name: 'Mobipocket E-Book', category: 'ocr' },
  azw3: { ext: 'azw3', name: 'Kindle Format 8', category: 'ocr' },
};

export function getCompatibleTargetFormats(sourceExt) {
  if (!sourceExt) return ['pdf', 'docx', 'txt', 'png', 'jpg', 'webp', 'mp3', 'mp4', 'zip', 'json', 'stl'];

  const cleanExt = sourceExt.toLowerCase().replace('.', '');
  const lookupKey = cleanExt === 'jpeg' ? 'jpg' : cleanExt;
  const srcInfo = FORMAT_OPTIONS[lookupKey];

  if (srcInfo) {
    const category = srcInfo.category;
    const categoryExts = Object.keys(FORMAT_OPTIONS).filter(
      (ext) => FORMAT_OPTIONS[ext].category === category && ext !== cleanExt && ext !== lookupKey
    );

    if (category === 'video') {
      categoryExts.push('mp3', 'wav', 'aac', 'flac', 'gif');
    } else if (category === 'image') {
      categoryExts.push('pdf');
    } else if (category === 'word') {
      categoryExts.push('epub');
    }

    return Array.from(new Set(categoryExts));
  }

  return ['pdf', 'docx', 'txt', 'png', 'jpg', 'webp', 'mp3', 'mp4', 'zip', 'json', 'stl'];
}
