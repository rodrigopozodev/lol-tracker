"use client";
import React, { useState } from "react";

type Props = {
  src?: string | null;
  size?: number;
  alt?: string;
  className?: string;
};

export default function ProfileIcon({ src, size = 64, alt = "Icono de perfil", className }: Props) {
  const [imgSrc, setImgSrc] = useState(
    src || "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/0.png"
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={imgSrc}
      width={size}
      height={size}
      className={["w-full h-full object-cover", className].filter(Boolean).join(" ")}
      onError={() => {
        // Si falla la imagen, usamos el ícono por defecto (0)
        setImgSrc("https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/0.png");
      }}
    />
  );
}