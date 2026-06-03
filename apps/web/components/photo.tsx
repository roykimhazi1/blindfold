"use client";

import { useEffect, useState } from "react";
import { PHOTOS } from "@/lib/photos";

export { PHOTOS };

/**
 * Decorative photo rendered as a background image (robust to load failures —
 * the `.photo` gradient shows through if the CDN is unreachable). Fades in once
 * the image has decoded. `blur` keeps mystery covers from giving the place away.
 */
export function Photo({
  src,
  alt,
  className = "",
  blur = false,
}: {
  src: string;
  alt: string;
  className?: string;
  blur?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => active && setLoaded(true);
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  return (
    <div className={`photo relative overflow-hidden ${className}`} role="img" aria-label={alt}>
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url("${src}")`,
          opacity: loaded ? 1 : 0,
          ...(blur ? { filter: "blur(3px)", transform: "scale(1.08)" } : null),
        }}
      />
    </div>
  );
}
