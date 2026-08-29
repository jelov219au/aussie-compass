export const vercelProjectIdMaxLength = 128;

export function isVercelProjectId(value: string) {
  if (!value.startsWith("prj_") || value.length <= 4 || value.length > vercelProjectIdMaxLength) return false;
  return !/[^A-Za-z0-9]/.test(value.slice(4));
}
