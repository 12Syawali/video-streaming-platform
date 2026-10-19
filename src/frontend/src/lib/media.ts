import { ExternalBlob } from "@caffeineai/object-storage";

/**
 * Backend `FileRef` values are opaque strings. When they are already absolute
 * URLs (object storage direct URLs) we use them as-is; otherwise we resolve
 * them through the object-storage client.
 */
export function resolveMediaUrl(
  ref: string | undefined | null,
): string | undefined {
  if (!ref) return undefined;
  if (
    /^(https?:)?\/\//.test(ref) ||
    ref.startsWith("data:") ||
    ref.startsWith("blob:")
  ) {
    return ref;
  }
  try {
    return ExternalBlob.fromURL(ref).getDirectURL();
  } catch {
    return ref;
  }
}
