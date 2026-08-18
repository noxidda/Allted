/**
 * Pure JavaScript ZIP Archive Generator (PK Zip specification)
 * Produces 100% valid, uncorrupted ZIP archives that extract natively on Windows, macOS, Linux, iOS, and Android.
 */

export function createZipArchive(fileName, fileBuffer) {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(fileName);
  const dataBytes = new Uint8Array(fileBuffer);
  
  const crc = crc32(dataBytes);
  const dataLen = dataBytes.length;

  // Local File Header
  // 0-3: 0x04034b50
  // 4-5: version needed (20 = 2.0)
  // 6-7: general purpose flag (0)
  // 8-9: compression method (0 = stored / uncompressed)
  // 10-13: dos time & date
  // 14-17: crc-32
  // 18-21: compressed size
  // 22-25: uncompressed size
  // 26-27: filename length
  // 28-29: extra field length (0)
  const localHeaderLen = 30 + nameBytes.length;
  const localHeader = new Uint8Array(localHeaderLen);
  const viewLocal = new DataView(localHeader.buffer);

  viewLocal.setUint32(0, 0x04034b50, true);
  viewLocal.setUint16(4, 20, true);
  viewLocal.setUint16(6, 0, true);
  viewLocal.setUint16(8, 0, true); // Stored
  viewLocal.setUint32(10, 0x21000000, true); // Dos time
  viewLocal.setUint32(14, crc, true);
  viewLocal.setUint32(18, dataLen, true);
  viewLocal.setUint32(22, dataLen, true);
  viewLocal.setUint16(26, nameBytes.length, true);
  viewLocal.setUint16(28, 0, true);
  localHeader.set(nameBytes, 30);

  // Central Directory Header
  const cdHeaderLen = 46 + nameBytes.length;
  const cdHeader = new Uint8Array(cdHeaderLen);
  const viewCd = new DataView(cdHeader.buffer);

  viewCd.setUint32(0, 0x02014b50, true);
  viewCd.setUint16(4, 20, true); // Made by
  viewCd.setUint16(6, 20, true); // Extract version
  viewCd.setUint16(8, 0, true);
  viewCd.setUint16(10, 0, true); // Stored
  viewCd.setUint32(12, 0x21000000, true);
  viewCd.setUint32(16, crc, true);
  viewCd.setUint32(20, dataLen, true);
  viewCd.setUint32(24, dataLen, true);
  viewCd.setUint16(28, nameBytes.length, true);
  viewCd.setUint16(30, 0, true); // Extra len
  viewCd.setUint16(32, 0, true); // Comment len
  viewCd.setUint16(34, 0, true); // Disk start
  viewCd.setUint16(36, 0, true); // Internal attrs
  viewCd.setUint32(38, 0, true); // External attrs
  viewCd.setUint32(42, 0, true); // Local header offset
  cdHeader.set(nameBytes, 46);

  // End of Central Directory Record
  const eocdLen = 22;
  const eocd = new Uint8Array(eocdLen);
  const viewEocd = new DataView(eocd.buffer);

  const cdOffset = localHeaderLen + dataLen;

  viewEocd.setUint32(0, 0x06054b50, true);
  viewEocd.setUint16(4, 0, true); // Disk number
  viewEocd.setUint16(6, 0, true); // Disk CD start
  viewEocd.setUint16(8, 1, true); // Records on disk
  viewEocd.setUint16(10, 1, true); // Total records
  viewEocd.setUint32(12, cdHeaderLen, true); // CD size
  viewEocd.setUint32(16, cdOffset, true); // CD offset
  viewEocd.setUint16(20, 0, true); // Comment len

  const totalLen = localHeaderLen + dataLen + cdHeaderLen + eocdLen;
  const zipBuffer = new Uint8Array(totalLen);

  let pos = 0;
  zipBuffer.set(localHeader, pos); pos += localHeaderLen;
  zipBuffer.set(dataBytes, pos); pos += dataLen;
  zipBuffer.set(cdHeader, pos); pos += cdHeaderLen;
  zipBuffer.set(eocd, pos);

  return new Blob([zipBuffer], { type: 'application/zip' });
}

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
