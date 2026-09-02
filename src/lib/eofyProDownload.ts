type DownloadEnvironment = {
  urls: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  document: Pick<Document, "createElement">;
};

// A successful request is not proof that the browser saved the file to disk.
export function requestEofyDownload(access: () => DownloadEnvironment, blob: Blob, filename: string): boolean {
  let environment: DownloadEnvironment | null = null;
  let url: string | null = null;
  try {
    environment = access();
    url = environment.urls.createObjectURL(blob);
    const anchor = environment.document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    if (environment && url !== null) {
      try {
        environment.urls.revokeObjectURL(url);
      } catch {
        // Cleanup failure does not undo an already requested download.
      }
    }
  }
}
