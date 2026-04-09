"use client";
import React, { useEffect, useState } from "react";
import { DDRAGON_VERSION_FALLBACK } from "@/lib/ddragon/cdnVersion";

type Props = {
  src?: string | null;
  size?: number;
  alt?: string;
  className?: string;
};

const FALLBACK_ICON = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION_FALLBACK}/img/profileicon/0.png`;

export default function ProfileIcon({ src, size = 64, alt = "Icono de perfil", className }: Props) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_ICON);

  useEffect(() => {
    setImgSrc(src || FALLBACK_ICON);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={imgSrc}
      width={size}
      height={size}
      className={["w-full h-full object-cover", className].filter(Boolean).join(" ")}
      onError={() => setImgSrc(FALLBACK_ICON)}
    />
  );
}
