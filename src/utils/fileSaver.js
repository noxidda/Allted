export async function exportFileWithPicker(blob, fileName) {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = fileName.split('.').pop() || '';
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: `${ext.toUpperCase()} File`,
            accept: {
              [blob.type || 'application/octet-stream']: [`.${ext}`],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled the file picker dialog
        return false;
      }
      console.warn('File picker error, falling back to download:', err);
    }
  }

  // Fallback to standard anchor download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
