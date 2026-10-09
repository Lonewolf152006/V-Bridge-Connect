import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';

function extractTextWithWorker(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(
      os.tmpdir(),
      `roster-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
    );

    fs.writeFile(tempFile, buffer, (writeErr) => {
      if (writeErr) return reject(writeErr);

      const workerPath = path.resolve(process.cwd(), 'src/lib/roster/pdf-worker.js');
      execFile(
        process.execPath,
        [workerPath, tempFile],
        { timeout: 20000, maxBuffer: 10 * 1024 * 1024 },
        async (execErr, stdout, stderr) => {
          try {
            await fs.promises.unlink(tempFile);
          } catch (_) {}

          if (execErr) {
            return reject(new Error(stderr?.trim() || execErr.message));
          }

          try {
            const parsed = JSON.parse(stdout);
            if (parsed.success) {
              resolve(parsed.text || '');
            } else {
              reject(new Error(parsed.error || 'PDF extraction returned unsuccessful status'));
            }
          } catch (jsonErr: any) {
            reject(new Error(`Worker invalid response: ${stdout || jsonErr.message}`));
          }
        }
      );
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'No PDF file provided or invalid form data' }, { status: 400 });
    }
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Uploaded file must be a PDF document (.pdf)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';
    let lastError: string | null = null;

    // 1. Primary: Run via standalone Node child process to isolate from Webpack bundling & worker loader issues
    try {
      extractedText = await extractTextWithWorker(buffer);
    } catch (workerErr: any) {
      lastError = workerErr?.message || String(workerErr);
      console.warn('[ParsePDF Warning] Standalone worker failed, trying in-process fallback:', lastError);
    }

    // 2. In-process direct fallback if worker didn't extract text
    if (!extractedText.trim()) {
      try {
        const pdfParseModule = require('pdf-parse');
        const PDFParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
        if (typeof PDFParse === 'function' && PDFParse.prototype?.getText) {
          const parser = new PDFParse({ data: buffer });
          try {
            const result = (await parser.getText()) as any;
            extractedText = result?.text || '';
          } finally {
            await parser.destroy?.().catch(() => {});
          }
        } else if (typeof pdfParseModule === 'function') {
          const result = await pdfParseModule(buffer);
          extractedText = result?.text || '';
        }
      } catch (inProcessErr: any) {
        lastError = inProcessErr?.message || String(inProcessErr);
      }
    }

    // 3. Raw stream fallback for uncompressed or simple text streams
    if (!extractedText.trim()) {
      const latinStr = buffer.toString('latin1');
      const tjMatches = latinStr.match(/\(([^()]+)\)\s*Tj/g);
      if (tjMatches && tjMatches.length > 0) {
        extractedText = tjMatches
          .map((m) => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim())
          .filter(Boolean)
          .join('\n');
      } else {
        const hexMatches = latinStr.match(/<([0-9A-Fa-f]+)>\s*Tj/g);
        if (hexMatches && hexMatches.length > 0) {
          extractedText = hexMatches
            .map((m) => {
              const hex = m.replace(/^</, '').replace(/>\s*Tj$/, '');
              try {
                return Buffer.from(hex, 'hex').toString('utf-8');
              } catch {
                return '';
              }
            })
            .filter(Boolean)
            .join('\n');
        }
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'The uploaded PDF contains no extractable text. It may be an image-only scan or encrypted.',
          details: lastError,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      text: extractedText,
      sizeBytes: file.size,
    });
  } catch (err: any) {
    console.error('[ParsePDF API Error]:', err);
    return NextResponse.json(
      {
        error: 'Failed to extract text from PDF: ' + (err.message || 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
