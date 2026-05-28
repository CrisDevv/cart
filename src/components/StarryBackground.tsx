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
  frameCount?: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  decay: number;
  fontSize: number;
}

interface StarryBackgroundProps {
  isUnlocked?: boolean;
}

export default function StarryBackground({ isUnlocked = false }: StarryBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let sparkParticles: SparkParticle[] = [];
    let floatingTexts: FloatingText[] = [];

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
      // Re-use star field to avoid visual jumping when unlocking or state changing
      if (starsRef.current.length > 0) return;
      
      const count = Math.floor((canvas.width * canvas.height) / 8000);
      const newStars: Star[] = [];
      for (let i = 0; i < count; i++) {
        newStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.2,
          alpha: Math.random(),
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
        });
      }
      starsRef.current = newStars;
    };

    const triggerShootingStar = () => {
      if (shootingStar.active) return;
      
      const startX = Math.random() * canvas.width * 0.85;
      const startY = Math.random() * canvas.height * 0.4;
      const angle = Math.PI / 6 + Math.random() * (Math.PI / 12); // around 30 to 45 degrees
      
      // Speed is slightly faster when unlocked ("deixe um pouco mais rapido" on second screen)
      const speed = isUnlocked 
        ? (8 + Math.random() * 6)  // Fast, sleek shooting star (8 to 14 px/frame)
        : (3.5 + Math.random() * 2.5); // Moderate (3.5 to 6 px/frame) to allow reading letters

      shootingStar = {
        x: startX,
        y: startY,
        length: isUnlocked ? (55 + Math.random() * 65) : (35 + Math.random() * 45),
        speed: speed,
        opacity: 1,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        active: true,
        frameCount: 0
      };
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Shooting stars loop interval 
    // Faster and more frequent frequency on the second page ("mais rapido" spawn interval)
    const intervalMs = isUnlocked ? 1600 : 3600;
    const probability = isUnlocked ? 0.65 : 0.45;

    const shootingStarInterval = setInterval(() => {
      if (Math.random() < probability) {
        triggerShootingStar();
      }
    }, intervalMs);

    const render = () => {
      // Clear black sky with trailing alpha
      ctx.fillStyle = "rgba(4, 7, 18, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Soft deep-space nebula radial backdrop
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.8
      );
      gradient.addColorStop(0, "rgba(225, 29, 72, 0.04)"); // Warm rose heart
      gradient.addColorStop(0.5, "rgba(88, 28, 135, 0.02)"); // Deep indigo veil
      gradient.addColorStop(1, "rgba(4, 7, 18, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render star matrix
      starsRef.current.forEach((star) => {
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
        ctx.shadowBlur = 0; // Reset blur for non-star drawing performance
      });

      // Update & Draw Spark Particles
      sparkParticles = sparkParticles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035; // gentle downward drift (micro-gravity)
        p.alpha -= p.decay;

        if (p.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color.replace("ALPHA", "1");
        ctx.fillStyle = p.color.replace("ALPHA", p.alpha.toString());
        ctx.fill();
        ctx.shadowBlur = 0; // immediate reset
        return true;
      });

      // Update & Draw Floating "Larissa" handwritten text
      floatingTexts = floatingTexts.filter((t) => {
        t.x += t.vx;
        t.y += t.vy;
        t.vx *= 0.98; // atmospheric deceleration
        t.vy *= 0.98;
        t.rotation += t.rotSpeed;
        t.alpha -= t.decay;

        if (t.alpha <= 0) return false;

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rotation);
        
        // Cursive handwriting style using "Caveat" or elegant serif font
        ctx.font = `italic 600 ${t.fontSize}px "Caveat", "Playfair Display", "Inter", cursive, Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Beautiful glowing red-rose aura
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(244, 63, 94, 0.85)";
        ctx.fillStyle = `rgba(255, 241, 242, ${t.alpha})`;
        ctx.fillText(t.text, 0, t.fontSize * 0.15); // visual centering adjustment
        
        ctx.restore();
        ctx.shadowBlur = 0; // reset
        return true;
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

        // Increment frame counter for lock screen particle releases
        shootingStar.frameCount = (shootingStar.frameCount || 0) + 1;

        // Lock Screen mode: spawn spark trail and magical name burst events
        if (!isUnlocked) {
          // Leave spark dust path
          if (Math.random() < 0.4) {
            sparkParticles.push({
              x: shootingStar.x,
              y: shootingStar.y,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
              color: "rgba(254, 205, 211, ALPHA)",
              size: Math.random() * 1.5 + 0.6,
              alpha: 0.8,
              decay: 0.02 + Math.random() * 0.02
            });
          }

          // Trigger name burst along the coordinate path every 12 frames
          if (shootingStar.frameCount % 12 === 0) {
            const burstColors = [
              "rgba(251, 113, 133, ALPHA)", // rose-400
              "rgba(244, 63, 94, ALPHA)",   // rose-500
              "rgba(255, 241, 242, ALPHA)",  // glowing rose white
              "rgba(253, 224, 71, ALPHA)"    // gold star dust
            ];

            // Star bursts!
            const countSparks = 10 + Math.floor(Math.random() * 6);
            for (let i = 0; i < countSparks; i++) {
              const angle = Math.random() * Math.PI * 2;
              const rangeSpeed = 1.2 + Math.random() * 3.5;
              sparkParticles.push({
                x: shootingStar.x,
                y: shootingStar.y,
                vx: Math.cos(angle) * rangeSpeed,
                vy: Math.sin(angle) * rangeSpeed,
                color: burstColors[Math.floor(Math.random() * burstColors.length)],
                size: Math.random() * 2.0 + 1.0,
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.02
              });
            }

            // Word text choice
            const textOptions = ["Larissa", "Larissa, Larissa"];
            const word = textOptions[Math.floor(Math.random() * textOptions.length)];
            const textAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; // upward floating path
            const textSpeed = 0.4 + Math.random() * 0.8;

            floatingTexts.push({
              x: shootingStar.x,
              y: shootingStar.y,
              text: word,
              vx: Math.cos(textAngle) * textSpeed,
              vy: Math.sin(textAngle) * textSpeed,
              alpha: 1.0,
              scale: 0.6 + Math.random() * 0.4,
              rotation: (Math.random() - 0.5) * 0.4,
              rotSpeed: (Math.random() - 0.5) * 0.015,
              decay: 0.007 + Math.random() * 0.005, // durable floatation
              fontSize: 16 + Math.floor(Math.random() * 8) // size range
            });
          }
        }

        // Update shooting star coordinates
        shootingStar.x += shootingStar.dx;
        shootingStar.y += shootingStar.dy;
        shootingStar.opacity -= 0.015;

        // Terminal edge detection or fading completion
        if (
          shootingStar.x > canvas.width ||
          shootingStar.y > canvas.height ||
          shootingStar.opacity <= 0
        ) {
          // Parting explosion upon fade/exit
          if (!isUnlocked && shootingStar.opacity <= 0.2) {
            const partingColors = [
              "rgba(244, 63, 94, ALPHA)",
              "rgba(251, 113, 133, ALPHA)",
              "rgba(255, 255, 255, ALPHA)"
            ];

            const fineBursts = 14 + Math.floor(Math.random() * 8);
            for (let i = 0; i < fineBursts; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1.0 + Math.random() * 4.0;
              sparkParticles.push({
                x: Math.min(shootingStar.x, canvas.width - 20),
                y: Math.min(shootingStar.y, canvas.height - 20),
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: partingColors[Math.floor(Math.random() * partingColors.length)],
                size: Math.random() * 2.5 + 1.0,
                alpha: 1.0,
                decay: 0.01 + Math.random() * 0.02
              });
            }

            // A final parting floaty word
            floatingTexts.push({
              x: Math.min(shootingStar.x - 20, canvas.width - 60),
              y: Math.min(shootingStar.y - 20, canvas.height - 60),
              text: "Larissa",
              vx: (Math.random() - 0.5) * 0.6,
              vy: -0.5 - Math.random() * 0.6,
              alpha: 1.0,
              scale: 0.8,
              rotation: (Math.random() - 0.5) * 0.2,
              rotSpeed: (Math.random() - 0.5) * 0.01,
              decay: 0.008,
              fontSize: 20 + Math.floor(Math.random() * 4)
            });
          }

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
  }, [isUnlocked]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
}
