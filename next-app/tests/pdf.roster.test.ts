import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/v1/roster/parse-pdf/route';
import { NextRequest } from 'next/server';

describe('PDF Roster Extraction Endpoint', () => {
  it('rejects upload when no file is sent', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://127.0.0.1:3000/api/v1/roster/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('No PDF file provided');
  }, 10000);

  it('rejects non-PDF files', async () => {
    const formData = new FormData();
    const blob = new Blob(['sample excel content'], { type: 'text/plain' });
    formData.append('file', blob, 'sample.txt');

    const req = new NextRequest('http://127.0.0.1:3000/api/v1/roster/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('must be a PDF');
  }, 10000);

  it('successfully extracts text from a valid PDF', async () => {
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 77 >> stream
BT
/F1 12 Tf
72 712 Td
(Group: Mini 1 | Guide: Dr. Sheetal Patil) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000371 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;

    const formData = new FormData();
    const blob = new Blob([minimalPdf], { type: 'application/pdf' });
    formData.append('file', blob, 'sample_roster.pdf');

    const req = new NextRequest('http://127.0.0.1:3000/api/v1/roster/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    const json = await res.json();
    if (res.status !== 200) console.log('DEBUG RES:', res.status, json);
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.text).toContain('Dr. Sheetal Patil');
  }, 10000);
});
