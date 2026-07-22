import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  /** Use when parent already constrains size via CSS (fill mode). */
  fillContainer?: boolean;
};

/**
 * next/image wrapper for remote genealogy assets.
 * Falls back to unoptimized for very long signed Google URLs when needed.
 */
export default function RemoteImage({
  src,
  alt,
  fillContainer,
  className,
  width,
  height,
  sizes,
  ...rest
}: Props) {
  if (fillContainer) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? "100vw"}
        unoptimized
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 500}
      className={className}
      sizes={sizes}
      unoptimized
      {...rest}
    />
  );
}
