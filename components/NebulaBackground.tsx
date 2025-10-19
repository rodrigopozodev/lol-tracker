"use client";
import { useEffect, useRef } from "react";

// Fondo tipo nebulosa: líneas aleatorias con flujo suave y blend aditivo
export default function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Line = {
      x: number;
      y: number;
      speed: number;
      width: number;
      color: string;
      shadow: string;
    };

    const lines: Line[] = [];
    const baseCount = width > 1024 ? 140 : width > 768 ? 110 : 90;
    const warm = (a: number) => `rgba(255, 140, 0, ${a})`;
    const cool = (a: number) => `rgba(61, 126, 255, ${a})`;
    const violet = (a: number) => `rgba(145, 86, 255, ${a})`;

    for (let i = 0; i < baseCount; i++) {
      const group = i % 3;
      const colorFn = group === 0 ? warm : group === 1 ? cool : violet;
      lines.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.9 + Math.random() * 0.7,
        width: 1 + Math.random() * 1.8,
        color: colorFn(0.14 + Math.random() * 0.10),
        shadow: colorFn(0.7),
      });
    }

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.05,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    gradient.addColorStop(0, "#0b102a");
    gradient.addColorStop(1, "#000000");

    // ruido suave pseudo-aleatorio continuo
    const noise = (x: number, y: number, t: number) => {
      return fract(Math.sin(x * 0.008 + y * 0.010 + t * 0.0006) * 43758.5453);
    };
    const fract = (n: number) => n - Math.floor(n);

    let running = true;
    let last = performance.now();

    const animate = (now: number) => {
      if (!running) return;
      const dt = Math.min(33, now - last);
      last = now;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";

      for (const l of lines) {
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.shadowBlur = 16;
        ctx.shadowColor = l.shadow;
        let px = l.x;
        let py = l.y;
        const steps = 70; // longitud de cada trazo
        for (let i = 0; i < steps; i++) {
          const ang = noise(px, py, now) * Math.PI * 2;
          px += Math.cos(ang) * l.speed;
          py += Math.sin(ang) * l.speed;
          ctx.lineTo(px, py);
        }
        ctx.lineWidth = l.width;
        ctx.strokeStyle = l.color;
        ctx.stroke();

        // avanza el origen al final para continuidad
        l.x = px;
        l.y = py;
        // envolver en bordes para evitar líneas fuera de pantalla
        if (l.x < -10) l.x = width + 10; else if (l.x > width + 10) l.x = -10;
        if (l.y < -10) l.y = height + 10; else if (l.y > height + 10) l.y = -10;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full pointer-events-none" />
  );
}