import NextImage from "next/image";

function toSameOriginMedia(src) {
  // Static imports (StaticImageData) and already-relative paths need no change.
  if (typeof src !== "string") return src;
  if (!/^https?:\/\//i.test(src)) return src;

  try {
    const { pathname, search } = new URL(src);
    // Only media assets are proxied by the `/media/*` rewrite; leave any other
    // absolute URL untouched so it still resolves via `images.remotePatterns`.
    return pathname.startsWith("/media/") ? `${pathname}${search}` : src;
  } catch {
    return src;
  }
}

export function Image({ src, ...props }) {
  return <NextImage src={toSameOriginMedia(src)} {...props} />;
}

export default Image;
