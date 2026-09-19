/**
 * Pure Node.js standards-compliant PDF 1.4 generator
 * Creates valid PDF documents without external dependencies
 */
export function generatePdfDocument(
  title: string,
  details: Record<string, string | number> = {},
  notes: string[] = []
): Buffer {
  const sanitize = (text: string) => text.replace(/[\(\)\\\r\n]/g, ' ');

  const contentLines: string[] = [
    'BT',
    '/F1 18 Tf',
    '50 770 Td',
    `(${sanitize(title)}) Tj`,
    '/F1 10 Tf',
    '0 -24 Td',
    '(DEPARTMENT OF REVENUE & LAND RECORDS - BHOOMICHAIN PORTAL) Tj',
    '0 -10 Td',
    '(----------------------------------------------------------------------------------------------------) Tj',
    '0 -24 Td',
    '/F1 12 Tf',
  ];

  for (const [key, value] of Object.entries(details)) {
    contentLines.push(
      `(${sanitize(key)}: ${sanitize(String(value))}) Tj`,
      '0 -18 Td'
    );
  }

  contentLines.push(
    '0 -15 Td',
    '/F1 9 Tf',
    '(DIGITAL RECORD NOTICE:) Tj',
    '0 -14 Td',
    '(This is an official digital record verified via DigiLocker e-KYC & Ethereum Smart Contract.) Tj',
    '0 -14 Td',
    '(Any unauthorized alteration or tampering invalidates the on-chain cryptographic signature.) Tj'
  );

  for (const note of notes) {
    contentLines.push(
      '0 -14 Td',
      `(${sanitize(note)}) Tj`
    );
  }

  contentLines.push('ET');

  const contentStream = contentLines.join('\n');
  const streamBytes = Buffer.from(contentStream, 'utf-8');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  const addObj = (str: string) => {
    offsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += str + '\n';
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  addObj(`4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj`);
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startXref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}
