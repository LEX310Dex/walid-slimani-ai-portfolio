import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';

// Migration builds copy immutable, hash-checked assets into Vercel's output.
// The deployed website has no runtime dependency on its previous host.
// Local deployments already contain every asset and need no download.
const origin = 'https://walid-slimani-field-notes.contentsaffron.chatgpt.site/';
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const root = resolve('dist');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
let cursor = 0;
async function worker() {
  while (cursor < manifest.length) {
    const item = manifest[cursor++];
    const destination = resolve(root, item.path);
    if (!destination.startsWith(root + sep)) throw new Error('Invalid asset path');
    let bytes;
    try { bytes = await readFile(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!bytes) {
      let failure;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(new URL(item.path, origin), { signal: AbortSignal.timeout(45000) });
          if (!response.ok) throw new Error(`${response.status}: ${item.path}`);
          bytes = Buffer.from(await response.arrayBuffer());
          if (digest(bytes) !== item.sha256) throw new Error(`Checksum mismatch: ${item.path}`);
          failure = null; break;
        } catch (error) { failure = error; await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); }
      }
      if (failure) throw failure;
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
    }
    if (digest(bytes) !== item.sha256) throw new Error(`Checksum mismatch: ${item.path}`);
    console.log(`Verified ${item.path}`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
console.log(`Ready: ${manifest.length} verified static files.`);
