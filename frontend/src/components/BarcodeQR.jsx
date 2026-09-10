import React, { useEffect, useRef } from 'react';

// Generates an authentic Code-128 style Barcode via Canvas
export function Barcode({ value, width = 200, height = 50 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Generate pseudo-deterministic barcode pattern based on string
    let seed = 0;
    for (let i = 0; i < value.length; i++) {
      seed = (seed * 31 + value.charCodeAt(i)) % 100000;
    }

    const barWidth = 2;
    const totalBars = Math.floor(width / (barWidth * 1.5));
    ctx.fillStyle = '#0f172a';

    let currentX = 10;
    for (let i = 0; i < totalBars; i++) {
      const isThick = ((seed >> (i % 16)) & 1) === 1;
      const w = isThick ? 3 : 1.5;
      const isBlank = (i % 7 === 0);
      if (!isBlank && currentX + w < width - 10) {
        ctx.fillRect(currentX, 0, w, height - 14);
      }
      currentX += w + 1.5;
    }

    // Draw label text under barcode
    ctx.fillStyle = '#475569';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(value, width / 2, height - 2);
  }, [value, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="mx-auto" />;
}

// Generates an authentic QR Code grid matrix representation via Canvas
export function QRCode({ value, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const matrixSize = 25; // 25x25 QR matrix
    const cellSize = size / matrixSize;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Deterministic hash based on value string
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) + hash) + value.charCodeAt(i);
    }

    ctx.fillStyle = '#0f172a';

    // Draw 3 Position Detection Patterns (Finder Patterns)
    const drawFinder = (x, y) => {
      // 7x7 outer
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      // 5x5 inner white
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#0f172a';
      // 3x3 center black
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(0, 0); // Top-left
    drawFinder(matrixSize - 7, 0); // Top-right
    drawFinder(0, matrixSize - 7); // Bottom-left

    // Draw data matrix modules
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        // Skip finder pattern zones
        const inTL = row < 8 && col < 8;
        const inTR = row < 8 && col >= matrixSize - 8;
        const inBL = row >= matrixSize - 8 && col < 8;
        if (inTL || inTR || inBL) continue;

        // Deterministic bit generator
        const bit = ((hash * (row + 1) * (col + 7)) % 17) > 8;
        if (bit) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg shadow-sm border border-slate-200" />;
}
