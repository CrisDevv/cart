import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleDir: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  dx: number;
  dy: number;
  active: boolean;
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      opacity: 0,
      dx: 0,
      dy: 0,
      active: false,
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.2,
          alpha: Math.random(),
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };

    const triggerShootingStar = () => {
      if (shootingStar.active) return;
      
      const startX = Math.random() * canvas.width * 0.8;
      const startY = Math.random() * canvas.height * 0.4;
      const angle = Math.PI / 6 + Math.random() * (Math.PI / 12); // around 30 to 45 degrees
      const speed = 4 + Math.random() * 6;

      shootingStar = {
        x: startX,
        y: startY,
        length: 40 + Math.random() * 60,
        speed: speed,
        opacity: 1,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        active: true,
      };
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Shooting stars loop
    const shootingStarInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        triggerShootingStar();
      }
    }, 4000);

    const render = () => {
      // Very slight alpha-to-background clears canvas, creating soft trails for shooting stars
      ctx.fillStyle = "rgba(4, 7, 18, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw faint nebula spots
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.8
      );
      gradient.addColorStop(0, "rgba(225, 29, 72, 0.04)"); // Soft primary rose glow inside
      gradient.addColorStop(0.5, "rgba(88, 28, 135, 0.02)"); // Soft indigo glow
      gradient.addColorStop(1, "rgba(4, 7, 18, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars with twinkle
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed * star.twinkleDir;
        if (star.alpha >= 1) {
          star.alpha = 1;
          star.twinkleDir = -1;
        } else if (star.alpha <= 0.1) {
          star.alpha = 0.1;
          star.twinkleDir = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowBlur = star.radius * 2;
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
      });

      // Draw shooting star if active
      if (shootingStar.active) {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - shootingStar.dx * 8,
          shootingStar.y - shootingStar.dy * 8
        );
        grad.addColorStop(0, `rgba(254, 205, 211, ${shootingStar.opacity})`);
        grad.addColorStop(0.5, `rgba(244, 63, 94, ${shootingStar.opacity * 0.4})`);
        grad.addColorStop(1, "rgba(244, 63, 94, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(
          shootingStar.x - shootingStar.dx * 1.5,
          shootingStar.y - shootingStar.dy * 1.5
        );
        ctx.stroke();

        // Update shooting star movement
        shootingStar.x += shootingStar.dx;
        shootingStar.y += shootingStar.dy;
        shootingStar.opacity -= 0.015;

        if (
          shootingStar.x > canvas.width ||
          shootingStar.y > canvas.height ||
          shootingStar.opacity <= 0
        ) {
          shootingStar.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(shootingStarInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
}
