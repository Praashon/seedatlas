import { useEffect, useRef, useState } from 'react';
import { Compass, Crosshair, Flag, Grid2X2, Layers2, Minus, Plus } from 'lucide-react';
import type {
  Dimension,
  Discovery,
  EngineResponse,
  Position,
  Waypoint,
} from '../../../../packages/contracts';
import { STRUCTURES } from '../../../../packages/generator-core';

interface Props {
  seed: string;
  version: string;
  dimension: Dimension;
  position: Position;
  results: Discovery[];
  selected: Discovery | null;
  waypoints: Waypoint[];
  onSelect: (discovery: Discovery) => void;
  onPoint: (position: Position) => void;
  supported: boolean;
  radius: number;
}
export function AtlasMap(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const worker = useRef<Worker | null>(null);
  const [center, setCenter] = useState({ x: props.position.x, z: props.position.z });
  const [span, setSpan] = useState(4096);
  const [raster, setRaster] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [grid, setGrid] = useState(true);
  const [layers, setLayers] = useState(false);
  const drag = useRef<{ x: number; y: number; cx: number; cz: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);
  useEffect(() => {
    setCenter({ x: props.position.x, z: props.position.z });
  }, [props.position.x, props.position.z, props.seed, props.dimension]);
  useEffect(() => {
    setRaster(null);
    setError('');
    if (!props.supported) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const current = new Worker(new URL('../workers/generator.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.current = current;
    const id = crypto.randomUUID();
    current.onmessage = (event: MessageEvent<EngineResponse>) => {
      if (event.data.requestId !== id) return;
      if (event.data.kind === 'map') {
        setRaster(
          new ImageData(new Uint8ClampedArray(event.data.pixels), event.data.size, event.data.size),
        );
        setLoading(false);
      }
      if (event.data.kind === 'error') {
        setError(event.data.message);
        setLoading(false);
      }
    };
    current.onerror = () => {
      setError('The local map engine could not load. Reload to retry.');
      setLoading(false);
    };
    current.postMessage({
      kind: 'map',
      requestId: id,
      seed: props.seed,
      version: props.version,
      dimension: props.dimension,
      x: center.x,
      z: center.z,
      y: props.position.y,
      span,
      size: 128,
    });
    return () => {
      current.terminate();
    };
  }, [
    props.seed,
    props.version,
    props.dimension,
    props.position.y,
    props.supported,
    center.x,
    center.z,
    span,
    retry,
  ]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    function draw() {
      if (!element) return;
      const ctx = element.getContext('2d');
      if (!ctx) return;
      const rect = element.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      element.width = Math.round(rect.width * dpr);
      element.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
      const w = rect.width,
        h = rect.height;
      ctx.fillStyle = '#303c30';
      ctx.fillRect(0, 0, w, h);
      if (raster) {
        const offscreen = document.createElement('canvas');
        offscreen.width = raster.width;
        offscreen.height = raster.height;
        offscreen.getContext('2d')?.putImageData(raster, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 0, 0, w, h);
      }
      if (grid) {
        ctx.strokeStyle = 'rgba(247,242,220,.12)';
        ctx.lineWidth = 1;
        const step = span / 8;
        for (
          let worldX = Math.ceil((center.x - span / 2) / step) * step;
          worldX <= center.x + span / 2;
          worldX += step
        ) {
          const x = ((worldX - center.x + span / 2) / span) * w;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (
          let worldZ = Math.ceil((center.z - span / 2) / step) * step;
          worldZ <= center.z + span / 2;
          worldZ += step
        ) {
          const y = ((worldZ - center.z + span / 2) / span) * h;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
    }
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    return () => observer.disconnect();
  }, [raster, grid, span, center]);
  const marker = (x: number, z: number) => ({
    left: `${((x - center.x + span / 2) / span) * 100}%`,
    top: `${((z - center.z + span / 2) / span) * 100}%`,
  });
  const visible = (x: number, z: number) =>
    Math.abs(x - center.x) < span / 2 && Math.abs(z - center.z) < span / 2;
  const pointFromPointer = (event: React.PointerEvent) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(center.x + ((event.clientX - box.left) / box.width - 0.5) * span),
      z: Math.round(center.z + ((event.clientY - box.top) / box.height - 0.5) * span),
    };
  };
  return (
    <section className="atlas-map" aria-label="Interactive biome map">
      <div
        className="map-surface"
        tabIndex={0}
        role="application"
        aria-label="Biome map. Use arrow keys to pan, plus and minus to zoom. Click to choose waypoint coordinates."
        onKeyDown={(event) => {
          const changes: Record<string, [number, number]> = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
          };
          if (changes[event.key]) {
            event.preventDefault();
            const [dx, dz] = changes[event.key];
            setCenter((c) => ({ x: c.x + (dx * span) / 8, z: c.z + (dz * span) / 8 }));
          }
          if (event.key === '+' || event.key === '=') setSpan((v) => Math.max(256, v / 2));
          if (event.key === '-') setSpan((v) => Math.min(16384, v * 2));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, cx: center.x, cz: center.z };
        }}
        onPointerMove={(event) => setHover(pointFromPointer(event))}
        onPointerLeave={() => setHover(null)}
        onPointerUp={(event) => {
          if (!drag.current) return;
          const box = event.currentTarget.getBoundingClientRect();
          const dx = event.clientX - drag.current.x,
            dy = event.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 5)
            setCenter({
              x: Math.round(drag.current.cx - (dx / box.width) * span),
              z: Math.round(drag.current.cz - (dy / box.height) * span),
            });
          else props.onPoint({ ...pointFromPointer(event), y: props.position.y });
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onWheel={(event) => {
          if (event.ctrlKey) event.preventDefault();
          setSpan((v) => (event.deltaY > 0 ? Math.min(16384, v * 2) : Math.max(256, v / 2)));
        }}
      >
        <canvas ref={canvas} />
      </div>
      {raster && (
        <svg
          className="search-radius-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <ellipse
            cx={((props.position.x - center.x + span / 2) / span) * 100}
            cy={((props.position.z - center.z + span / 2) / span) * 100}
            rx={(props.radius / span) * 100}
            ry={(props.radius / span) * 100}
          />
        </svg>
      )}
      <div className="map-overlay map-caption">
        <span className="live-dot" />
        {props.supported ? 'BIOME ATLAS' : 'ADAPTER UNAVAILABLE'}
        <span className="map-caption-divider" />Y {props.position.y}
      </div>
      <div className="map-compass">
        <span>N</span>
        <Compass size={43} strokeWidth={1} />
        <span className="compass-bottom">S</span>
      </div>
      {!raster && (
        <div className="map-message" role="status">
          {error ? (
            <>
              <span>{error}</span>
              <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>
                Retry
              </button>
            </>
          ) : loading ? (
            <>
              <span className="spinner" />
              Drawing your world…
            </>
          ) : (
            'This version needs a validated browser adapter.'
          )}
        </div>
      )}
      {raster &&
        props.results
          .filter((d) => visible(d.x, d.z))
          .map((discovery) => (
            <button
              key={discovery.id}
              className={`map-marker ${props.selected?.id === discovery.id ? 'selected' : ''}`}
              style={
                {
                  ...marker(discovery.x, discovery.z),
                  '--marker-color':
                    STRUCTURES.find((s) => s.id === discovery.type)?.color ?? '#d4deaa',
                } as React.CSSProperties
              }
              title={`${discovery.name} · X ${discovery.x}, Z ${discovery.z} · Predicted`}
              aria-label={`${discovery.name} at ${discovery.x}, ${discovery.z}`}
              onClick={() => props.onSelect(discovery)}
            >
              <Flag size={14} fill="currentColor" />
            </button>
          ))}
      {raster &&
        props.waypoints
          .filter((p) => p.dimension === props.dimension && visible(p.x, p.z))
          .map((p) => (
            <span
              key={p.id}
              className="waypoint-marker"
              style={marker(p.x, p.z)}
              title={`${p.name}: ${p.x}, ${p.z}`}
            >
              <Flag size={17} fill="currentColor" />
            </span>
          ))}
      {raster && visible(props.position.x, props.position.z) && (
        <div className="player-marker" style={marker(props.position.x, props.position.z)}>
          <span />
          <div>You are here</div>
        </div>
      )}
      <div className="map-zoom">
        <button aria-label="Zoom in" onClick={() => setSpan((v) => Math.max(256, v / 2))}>
          <Plus size={18} />
        </button>
        <span />
        <button aria-label="Zoom out" onClick={() => setSpan((v) => Math.min(16384, v * 2))}>
          <Minus size={18} />
        </button>
      </div>
      <div className="map-tools">
        <button
          aria-label="Center on player"
          onClick={() => setCenter({ x: props.position.x, z: props.position.z })}
        >
          <Crosshair size={18} />
        </button>
        <button aria-label="Map layers" onClick={() => setLayers(!layers)}>
          <Layers2 size={18} />
        </button>
      </div>
      {layers && (
        <div className="layers-popover">
          <strong>Map layers</strong>
          <label>
            <input
              type="checkbox"
              checked={grid}
              onChange={(event) => setGrid(event.target.checked)}
            />
            <Grid2X2 size={14} />
            Coordinate grid
          </label>
          <p>
            Colors show sampled biomes at Y {props.position.y}. No terrain elevation is implied.
          </p>
        </div>
      )}
      <div className="map-scale">
        <span />
        {(span / 8).toLocaleString()} blocks
      </div>
      <div className="map-coordinates">
        X <b>{(hover?.x ?? center.x).toLocaleString()}</b>
        <span />Z <b>{(hover?.z ?? center.z).toLocaleString()}</b>
      </div>
      <div className="map-bottom-note">
        {span / 128} block sampling <span>·</span> Cubiomes prediction
      </div>
    </section>
  );
}
