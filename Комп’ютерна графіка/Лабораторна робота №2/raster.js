
(function (root) {
  "use strict";

  function integers(...values) {
    if (values.some(value => !Number.isInteger(value) || Math.abs(value) > 2048)) {
      throw new RangeError("Параметри мають бути цілими числами в межах ±2048.");
    }
  }

  function lineDDA(x1, y1, x2, y2) {
    integers(x1, y1, x2, y2);
    const dx = x2 - x1, dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const pixels = [];
    const stats = { steps, divisions: 0, roundings: 0, coordinateAdds: 0, errorUpdates: 0, directionTests: 0, doublings: 0 };
    if (steps === 0) return { pixels: [[x1, y1]], stats };
    const xInc = dx / steps, yInc = dy / steps;
    stats.divisions = 2;
    let x = x1, y = y1;
    for (let i = 0; i <= steps; i++) {

      pixels.push([Math.round(x), Math.round(y)]);
      stats.roundings += 2;
      if (i < steps) {
        x += xInc;
        y += yInc;
        stats.coordinateAdds += 2;
      }
    }
    return { pixels, stats };
  }

  function lineBresenham(x1, y1, x2, y2) {
    integers(x1, y1, x2, y2);
    const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    const pixels = [];
    const stats = { steps: 0, divisions: 0, roundings: 0, coordinateAdds: 0, errorUpdates: 0, directionTests: 0, doublings: 0 };
    let x = x1, y = y1, error = dx + dy;
    while (true) {
      pixels.push([x, y]);
      if (x === x2 && y === y2) break;
      const twiceError = error + error;
      stats.doublings++;
      stats.directionTests += 2;

      if (twiceError >= dy) {
        error += dy;
        x += sx;
        stats.errorUpdates++;
        stats.coordinateAdds++;
      }
      if (twiceError <= dx) {
        error += dx;
        y += sy;
        stats.errorUpdates++;
        stats.coordinateAdds++;
      }
      stats.steps++;
    }
    return { pixels, stats };
  }

  function uniqueCollector() {
    const pixels = [], seen = new Set();
    return {
      pixels,
      plot(x, y) {
        const key = `${x},${y}`;
        if (!seen.has(key)) { seen.add(key); pixels.push([x, y]); }
      }
    };
  }

  function circleBresenham(cx, cy, radius) {
    integers(cx, cy, radius);
    if (radius < 0) throw new RangeError("Радіус не може бути від’ємним.");
    const result = uniqueCollector();
    let x = 0, y = radius, decision = 1 - radius, iterations = 0;
    while (x <= y) {
      for (const [px, py] of [[x,y],[-x,y],[x,-y],[-x,-y],[y,x],[-y,x],[y,-x],[-y,-x]]) {
        result.plot(cx + px, cy + py);
      }

      if (decision < 0) decision += 2 * x + 3;
      else { decision += 2 * (x - y) + 5; y--; }
      x++;
      iterations++;
    }
    return { pixels: result.pixels, iterations };
  }

  function ellipseBresenham(cx, cy, a, b) {
    integers(cx, cy, a, b);
    if (a < 0 || b < 0) throw new RangeError("Півосі не можуть бути від’ємними.");

    if (a === 0 || b === 0) {
      const line = lineBresenham(cx - a, cy - b, cx + a, cy + b);
      return { pixels: line.pixels, region1: 0, region2: line.pixels.length };
    }
    const result = uniqueCollector(), a2 = a * a, b2 = b * b;
    let x = 0, y = b, dx = 0, dy = 2 * a2 * y;
    let region1 = 0, region2 = 0;

    let decision = 4 * b2 - 4 * a2 * b + a2;
    const symmetric = () => {
      result.plot(cx + x, cy + y); result.plot(cx - x, cy + y);
      result.plot(cx + x, cy - y); result.plot(cx - x, cy - y);
    };
    while (dx < dy) {
      symmetric();
      if (decision < 0) {
        x++; dx += 2 * b2;
        decision += 4 * dx + 4 * b2;
      } else {
        x++; y--; dx += 2 * b2; dy -= 2 * a2;
        decision += 4 * dx - 4 * dy + 4 * b2;
      }
      region1++;
    }

    decision = b2 * (2 * x + 1) ** 2 + 4 * a2 * (y - 1) ** 2 - 4 * a2 * b2;
    while (y >= 0) {
      symmetric();
      if (decision > 0) {
        y--; dy -= 2 * a2;
        decision += 4 * a2 - 4 * dy;
      } else {
        y--; x++; dx += 2 * b2; dy -= 2 * a2;
        decision += 4 * dx - 4 * dy + 4 * a2;
      }
      region2++;
    }
    return { pixels: result.pixels, region1, region2 };
  }

  function lineError(pixels, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, length = Math.hypot(dx, dy);
    if (!length) return 0;
    return Math.max(...pixels.map(([x,y]) => Math.abs(dy * (x-x1) - dx * (y-y1)) / length));
  }

  function comparePixels(first, second) {
    const a = new Set(first.map(p => p.join(',')));
    const b = new Set(second.map(p => p.join(',')));
    const common = [...a].filter(key => b.has(key)).length;
    return { common, onlyDDA: a.size-common, onlyBresenham: b.size-common, difference: a.size+b.size-2*common };
  }

  const api = { lineDDA, lineBresenham, circleBresenham, ellipseBresenham, lineError, comparePixels };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Raster = api;
})(typeof window !== 'undefined' ? window : globalThis);
