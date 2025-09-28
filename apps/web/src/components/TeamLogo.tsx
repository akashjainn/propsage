import Image from "next/image";

export function TeamLogo({
  src,
  alt,
  size = 48,
}: { src?: string; alt: string; size?: number }) {
  const fallback = "/logo-fallback.svg";
  
  return (
    <Image
      src={src || fallback}
      alt={alt}
      width={size}
      height={size}
      className="rounded-md bg-white/5"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (img.src.endsWith(fallback)) return; // avoid loop
        img.src = fallback;
      }}
      unoptimized // avoids domain allowlist if using external logos
    />
  );
}