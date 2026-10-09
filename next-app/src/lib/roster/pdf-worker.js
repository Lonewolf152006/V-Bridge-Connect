const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function main() {
  try {
    const target = process.argv[2];
    let buffer;
    if (!target || target === '-') {
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } else {
      buffer = fs.readFileSync(target);
    }

    if (!buffer || buffer.length === 0) {
      process.stdout.write(JSON.stringify({ success: false, error: 'Empty PDF buffer' }));
      process.exit(0);
    }

    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = result?.text || '';
      process.stdout.write(JSON.stringify({ success: true, text }));
    } finally {
      try {
        await parser.destroy();
      } catch (_) {}
    }
  } catch (err) {
    process.stdout.write(JSON.stringify({ success: false, error: err.message || String(err) }));
  }
}

main();
