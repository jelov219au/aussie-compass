const bodyLimit = 2048;

// Shared by car access and checkout. Read bounded chunks rather than buffering
// an arbitrarily large body; the input stream is consumed exactly once.
export async function readCarPurchaseRequestBody(request: Request): Promise<string | 400 | 413> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) return 400;
  if (declared !== null && Number(declared) > bodyLimit) return 413;
  if (!request.body) return "";
  if (request.bodyUsed || request.body.locked) return 400;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > bodyLimit) { void reader.cancel().catch(() => {}); return 413; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch { return 400; }
  finally { reader.releaseLock(); }
}
