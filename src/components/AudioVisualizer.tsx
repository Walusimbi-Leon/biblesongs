import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

export function AudioVisualizer({ isPlaying, barCount = 48 }: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height) || 40;
      if (w <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = w;
      height = h;
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize());
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', updateSize);
    }

    const render = () => {
      if (width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);

        if (isPlaying) {
          phaseRef.current += 0.05;
        }

        const count = barCount;
        const gap = 3;
        const totalGap = (count - 1) * gap;
        const barWidth = Math.max(2, (width - totalGap) / count);
        const centerY = height / 2;

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
        grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.7)');
        grad.addColorStop(1, 'rgba(217, 119, 6, 0.3)');

        for (let i = 0; i < count; i++) {
          const x = i * (barWidth + gap);
          const norm = i / count;
          let amp = 0.08;

          if (isPlaying) {
            const s1 = Math.sin(phaseRef.current * 1.4 + norm * Math.PI * 4);
            const s2 = Math.cos(phaseRef.current * 0.9 + norm * Math.PI * 2);
            const s3 = Math.sin(phaseRef.current * 2.2 + norm * Math.PI * 7);
            const envelope = Math.sin(norm * Math.PI);
            amp = Math.abs(s1 * 0.45 + s2 * 0.35 + s3 * 0.2) * envelope;
            amp = Math.max(0.1, amp);
          }

          const barHeight = Math.max(4, amp * (height * 0.85));
          const y = centerY - barHeight / 2;

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, barWidth, barHeight, 3);
          } else {
            ctx.rect(x, y, barWidth, barHeight);
          }
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', updateSize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center h-10 max-w-lg cursor-default select-none"
      title="Live audio rhythm visualizer"
    >
      <canvas ref={canvasRef} className="block rounded-lg" />
    </div>
  );
}
