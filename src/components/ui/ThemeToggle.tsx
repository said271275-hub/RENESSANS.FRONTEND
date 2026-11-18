import React, { useCallback, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Kun/Tun almashtirgich.
 * Kun: bolacha teshik yonida turadi. Bosilganda teshikka yuguradi, tushib ketadi va tun bo'ladi.
 * Tun: bosilganda bolacha teshikdan sakrab chiqadi va kun bo'ladi.
 */

type Phase = 'idle' | 'walking' | 'falling' | 'hidden' | 'rising';

interface Sim {
  phase: Phase;
  x: number;
  y: number; // bolachaning oyoq (pastki) nuqtasi
  vx: number;
  vy: number;
  target: number;
  t: number;
  dirty: boolean;
}

const BODY_H = 22;
const GRAVITY = 0.32;
const WALK_SPEED = 1.3;

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  const toggleRef = useRef(toggleTheme);
  const sizeRef = useRef({ w: 120, h: 36 });
  const simRef = useRef<Sim>({
    phase: theme === 'dark' ? 'hidden' : 'idle',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    target: 0,
    t: 0,
    dirty: true,
  });

  themeRef.current = theme;
  toggleRef.current = toggleTheme;

  const layout = () => {
    const { w, h } = sizeRef.current;
    return { holeX: w * 0.74, stickX: w * 0.3, groundY: h * 0.74 };
  };

  // ---------- physics ----------
  const updatePhysics = useCallback(() => {
    const s = simRef.current;
    const { holeX, stickX, groundY } = layout();
    s.t += 1;

    switch (s.phase) {
      case 'idle':
        s.x = stickX;
        s.y = groundY;
        break;
      case 'walking': {
        const dir = Math.sign(s.target - s.x) || 1;
        s.x += dir * WALK_SPEED;
        s.y = groundY;
        if ((dir > 0 && s.x >= s.target) || (dir < 0 && s.x <= s.target)) {
          s.x = s.target;
          if (s.target === holeX) {
            s.phase = 'falling';
            s.vy = 0.5;
          } else {
            s.phase = 'idle';
          }
        }
        s.dirty = true;
        break;
      }
      case 'falling':
        s.vy += GRAVITY;
        s.y += s.vy;
        s.x = holeX;
        if (s.y > groundY + BODY_H + 6) {
          s.phase = 'hidden';
          if (themeRef.current === 'light') toggleRef.current(); // tun bo'ladi
        }
        s.dirty = true;
        break;
      case 'hidden':
        s.x = holeX;
        s.y = groundY + BODY_H + 6;
        break;
      case 'rising': {
        s.vy += GRAVITY;
        s.y += s.vy;
        if (s.y < groundY - 2) {
          // yerdan chiqdi — o'z joyiga qarab suriladi
          s.x += Math.sign(stickX - s.x) * Math.min(Math.abs(stickX - s.x), 0.9);
        }
        if (s.vy > 0 && s.y >= groundY) {
          s.y = groundY;
          s.vy = 0;
          s.phase = 'walking';
          s.target = stickX;
        }
        s.dirty = true;
        break;
      }
    }
  }, []);

  // ---------- drawing ----------
  const drawHole = (ctx: CanvasRenderingContext2D, back: boolean) => {
    const { holeX, groundY } = layout();
    const dark = themeRef.current === 'dark';
    const rx = 12;
    const ry = 3.8;
    if (back) {
      const g = ctx.createLinearGradient(0, groundY - ry, 0, groundY + ry);
      g.addColorStop(0, dark ? '#050608' : '#8d97a8');
      g.addColorStop(1, dark ? '#14171c' : '#b6bfcd');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(holeX, groundY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // old tomondagi lab — bolachaning oyoqlarini "teshik ichida" ko'rsatadi
      ctx.strokeStyle = dark ? '#262b33' : '#f1f4f9';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(holeX, groundY, rx, ry, 0, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.stroke();
    }
  };

  const drawStickman = (ctx: CanvasRenderingContext2D) => {
    const s = simRef.current;
    if (s.phase === 'hidden') return;
    const { groundY } = layout();
    const dark = themeRef.current === 'dark';
    const color = dark ? '#f1f5f9' : '#1f2937';

    ctx.save();
    // yer ostidagi qismi ko'rinmaydi (teshikka sho'ng'ish)
    ctx.beginPath();
    ctx.rect(0, 0, sizeRef.current.w, groundY + 1);
    ctx.clip();

    const x = s.x;
    const feet = s.y;
    const hip = feet - 9;
    const neck = feet - 17;
    const headY = feet - 20.5;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';

    const swing = s.phase === 'walking' ? Math.sin(s.t * 0.5) * 4 : 0;
    const airborne = s.phase === 'falling' || (s.phase === 'rising' && s.y < groundY);

    ctx.beginPath();
    ctx.arc(x, headY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, neck + 1);
    ctx.lineTo(x, hip);
    if (airborne) {
      // qo'l ko'tarilgan, oyoq ochilgan
      ctx.moveTo(x, neck + 3);
      ctx.lineTo(x - 5, neck - 3);
      ctx.moveTo(x, neck + 3);
      ctx.lineTo(x + 5, neck - 3);
      ctx.moveTo(x, hip);
      ctx.lineTo(x - 4, feet);
      ctx.moveTo(x, hip);
      ctx.lineTo(x + 4, feet);
    } else {
      ctx.moveTo(x, neck + 3);
      ctx.lineTo(x - 4 - swing * 0.4, hip - 1);
      ctx.moveTo(x, neck + 3);
      ctx.lineTo(x + 4 + swing * 0.4, hip - 1);
      ctx.moveTo(x, hip);
      ctx.lineTo(x - 3 + swing, feet);
      ctx.moveTo(x, hip);
      ctx.lineTo(x + 3 - swing, feet);
    }
    ctx.stroke();
    ctx.restore();
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawHole(ctx, true);
    drawStickman(ctx);
    drawHole(ctx, false);
  }, []);

  // ---------- loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 120;
      const h = canvas.clientHeight || 36;
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const s = simRef.current;
      const { holeX, stickX, groundY } = layout();
      if (s.phase === 'idle') { s.x = stickX; s.y = groundY; }
      if (s.phase === 'hidden') { s.x = holeX; s.y = groundY + BODY_H + 6; }
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const renderLoop = () => {
      updatePhysics();
      if (simRef.current.dirty) {
        render();
        simRef.current.dirty = false;
      }
      raf = requestAnimationFrame(renderLoop);
    };
    raf = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [updatePhysics, render]);

  // Tashqaridan (masalan boshqa joyda) tema o'zgarsa — holatni moslash
  useEffect(() => {
    const s = simRef.current;
    const { holeX, stickX, groundY } = layout();
    if (theme === 'dark' && (s.phase === 'idle' || s.phase === 'walking')) {
      s.phase = 'hidden';
      s.x = holeX;
      s.y = groundY + BODY_H + 6;
    } else if (theme === 'light' && s.phase === 'hidden') {
      s.phase = 'idle';
      s.x = stickX;
      s.y = groundY;
    }
    s.dirty = true;
  }, [theme]);

  const handleClick = () => {
    const s = simRef.current;
    const { holeX, groundY } = layout();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      toggleTheme();
      return;
    }
    if (s.phase === 'idle') {
      s.phase = 'walking';
      s.target = holeX;
    } else if (s.phase === 'hidden') {
      s.phase = 'rising';
      s.x = holeX;
      s.y = groundY + BODY_H + 6;
      s.vy = -Math.sqrt(2 * GRAVITY * (BODY_H + 6 + 9));
      if (themeRef.current === 'dark') toggleTheme(); // kun bo'ladi
    }
    // animatsiya davomida bosishlar e'tiborga olinmaydi
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`inline-flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full neu-raised border border-[var(--border-subtle)] ${className}`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="relative w-9 h-9 shrink-0 rounded-full neu-raised hover:scale-105 active:neu-inset transition-all duration-200 flex items-center justify-center border border-[var(--border-subtle)]"
        title={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
        aria-label="Rejimni o'zgartirish"
        aria-pressed={isDark}
      >
        <Sun
          className={`absolute w-5 h-5 text-amber-400 transition-all duration-500 ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute w-5 h-5 text-sky-400 transition-all duration-500 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </button>
      <canvas
        ref={canvasRef}
        id="stage"
        onClick={handleClick}
        aria-hidden="true"
        className="w-[72px] sm:w-[112px] h-9 cursor-pointer"
      />
    </div>
  );
};
