"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const circles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.8,
      dy: (Math.random() - 0.5) * 0.8,
      color: Math.random() > 0.5
        ? "rgba(255, 153, 51, 0.7)" // naranja
        : "rgba(51, 153, 255, 0.7)", // azul
    }));

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      100,
      width / 2,
      height / 2,
      800
    );
    gradient.addColorStop(0, "#1e1b4b");
    gradient.addColorStop(1, "#000");

    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let c of circles) {
        ctx.beginPath();
        ctx.fillStyle = c.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = c.color;
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.dx;
        c.y += c.dy;

        if (c.x < 0 || c.x > width) c.dx *= -1;
        if (c.y < 0 || c.y > height) c.dy *= -1;
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full pointer-events-none" />
  );
}