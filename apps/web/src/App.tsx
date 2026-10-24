import { EmptyState } from './components/EmptyState';
import { OreGuide } from './components/OreGuide';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Copy,
  Diamond,
  Flag,
  Folder,
  GitFork,
  Globe2,
  Layers2,
  Leaf,
  Map,
  MapPin,
  Menu,
  Mountain,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Sun,
  Trees,
  TriangleAlert,
  X,
} from 'lucide-react';
import type {
  Dimension,
  Discovery,
  EngineResponse,
  Position,
  World,
} from '../../../packages/contracts';
import {
  getCapability,
  HEIGHTS,
  navigation,
  parseSeed,
  STRUCTURES,
  validateBounds,
  validatePosition,
  VersionCapabilityRegistry,
} from '../../../packages/generator-core';
import { AtlasMap } from './components/AtlasMap';
import { exportJson, readWorlds, storeWorld } from './lib/storage';

type Page = 'explorer' | 'structures' | 'biomes' | 'ores' | 'worlds' | 'saved' | 'settings';
const PAGES = [
  { id: 'explorer', name: 'World explorer', icon: Compass },
  { id: 'structures', name: 'Structure finder', icon: MapPin },
  { id: 'biomes', name: 'Biome explorer', icon: Trees },
  { id: 'ores', name: 'Ore guide', icon: Diamond },
  { id: 'worlds', name: 'My worlds', icon: Globe2 },
  { id: 'saved', name: 'Saved places', icon: Bookmark },
] as const;
const BIOMES = [
  { id: 1, name: 'Plains', dimension: 'overworld' },
  { id: 4, name: 'Forest', dimension: 'overworld' },
  { id: 185, name: 'Cherry grove', dimension: 'overworld' },
  { id: 14, name: 'Mushroom fields', dimension: 'overworld' },
  { id: 2, name: 'Desert', dimension: 'overworld' },
  { id: 21, name: 'Jungle', dimension: 'overworld' },
  { id: 184, name: 'Mangrove swamp', dimension: 'overworld' },
  { id: 175, name: 'Lush caves', dimension: 'overworld' },
  { id: 183, name: 'Deep dark', dimension: 'overworld' },
  { id: 174, name: 'Dripstone caves', dimension: 'overworld' },
  { id: 187, name: 'Sulfur caves', dimension: 'overworld' },
  { id: 186, name: 'Pale garden', dimension: 'overworld' },
  { id: 8, name: 'Nether wastes', dimension: 'nether' },
  { id: 171, name: 'Crimson forest', dimension: 'nether' },
  { id: 172, name: 'Warped forest', dimension: 'nether' },
  { id: 170, name: 'Soul sand valley', dimension: 'nether' },
  { id: 9, name: 'The End', dimension: 'end' },
  { id: 42, name: 'End highlands', dimension: 'end' },
];
function newWorld(): World {
  return {
    id: crypto.randomUUID(),
    name: 'A new horizon',
    seedInput: '262',
    seed: '262',
    version: '26.2',
    preset: 'default',
    createdAt: new Date().toISOString(),
    position: { x: 0, y: 64, z: 0 },
    waypoints: [],
    progress: {},
  };
}
export function App() {
  const [page, setPage] = useState<Page>('explorer');
  const [world, setWorld] = useState<World>(newWorld);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [seedInput, setSeedInput] = useState('262');
  const [version, setVersion] = useState('26.2');
  const [position, setPosition] = useState<Position>({ x: 0, y: 64, z: 0 });
  const [dimension, setDimension] = useState<Dimension>('overworld');
  const [types, setTypes] = useState<number[]>([5, 11, 13]);
  const [radius, setRadius] = useState(2048);
  const [resolution, setResolution] = useState(64);
  const [biome, setBiome] = useState(185);
  const [results, setResults] = useState<Discovery[]>([]);
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [dialog, setDialog] = useState<'world' | 'waypoint' | 'help' | null>(null);
  const [name, setName] = useState('');
  const [point, setPoint] = useState<Position | null>(null);
  const [dark, setDark] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [hasSearched, setHasSearched] = useState(false);
  const [hideExplored, setHideExplored] = useState(false);
  const activeWorker = useRef<Worker | null>(null);
  const activeRequest = useRef('');
  const writeQueue = useRef(Promise.resolve());
  const modal = useRef<HTMLDialogElement>(null);
  const saved = worlds.some((item) => item.id === world.id);
  const capability = getCapability(world.version);
  const supported = capability.engineVersion !== null;
  const available = STRUCTURES.filter(
    (item) =>
      item.dimension === dimension &&
      (world.version !== '1.18.2' || ![13, 23, 24].includes(item.id)) &&
      (world.version !== '1.20.6' || item.id !== 24),
  );
  const visibleResults = results.filter((item) => !hideExplored || !world.progress[item.id]);

  useEffect(() => {
    readWorlds()
      .then((items) => {
        setWorlds(items);
      })
      .catch((cause) => setError(String(cause.message)));
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const offlineError = () =>
      setError('Offline installation failed. Keep this tab open, or reload online to retry.');
    window.addEventListener('seedatlas-offline-error', offlineError);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('seedatlas-offline-error', offlineError);
      activeWorker.current?.terminate();
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    if (dialog) modal.current?.showModal();
    else modal.current?.close();
  }, [dialog]);
  const persist = useCallback(async (updated: World) => {
    // Serialize writes so a slow earlier transaction cannot overwrite newer progress.
    const operation = writeQueue.current.then(() => storeWorld(updated));
    writeQueue.current = operation.catch(() => undefined);
    await operation;
    setWorlds((items) => [...items.filter((item) => item.id !== updated.id), updated]);
    setWorld(updated);
  }, []);
  const runSearch = useCallback(
    (targetWorld: World, dim: Dimension, selectedTypes: number[], biomeId?: number) => {
      activeWorker.current?.terminate();
      activeRequest.current = '';
      setBusy(false);
      setResults([]);
      setSelected(null);
      setError('');
      setProgress(0);
      setHasSearched(false);
      try {
        if (getCapability(targetWorld.version).engineVersion === null)
          throw new Error(getCapability(targetWorld.version).limitations[0]);
        validatePosition(targetWorld.position, dim);
        validateBounds(radius, resolution);
        const current = new Worker(new URL('./workers/generator.worker.ts', import.meta.url), {
          type: 'module',
        });
        activeWorker.current = current;
        const requestId = crypto.randomUUID();
        activeRequest.current = requestId;
        setBusy(true);
        current.onmessage = (event: MessageEvent<EngineResponse>) => {
          const response = event.data;
          if (response.requestId !== activeRequest.current) return;
          if (response.kind === 'error') {
            setError(response.message);
            setBusy(false);
            current.terminate();
          }
          if (response.kind === 'progress') {
            setProgress(response.progress);
            setResults(response.results);
          }
          if (response.kind === 'results') {
            setResults(response.results);
            setProgress(100);
            setBusy(false);
            setHasSearched(true);
            current.terminate();
          }
        };
        current.onerror = () => {
          setBusy(false);
          setError('The browser engine could not load. Check the local engine files and retry.');
          current.terminate();
        };
        current.postMessage({
          kind: 'search',
          requestId,
          seed: targetWorld.seed,
          version: targetWorld.version,
          dimension: dim,
          ...targetWorld.position,
          radius,
          resolution,
          types: biomeId === undefined ? selectedTypes : [],
          biomeId,
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not start the search.');
      }
    },
    [radius, resolution],
  );
  // Initial example is a real seed calculation, not a prefilled list of discoveries.
  useEffect(() => {
    runSearch(world, 'overworld', [5, 11, 13]);
    return () => activeWorker.current?.terminate();
  }, []);

  async function applyWorld(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      validatePosition(position, dimension);
      const seed = parseSeed(seedInput);
      const changed = seed !== world.seed || version !== world.version;
      const updated: World = {
        ...(changed ? newWorld() : world),
        seed,
        seedInput,
        version,
        position,
      };
      setWorld(updated);
      if (!changed && saved) await persist(updated);
      runSearch(updated, dimension, types, page === 'biomes' ? biome : undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please check your world settings.');
    }
  }
  function changeDimension(dim: Dimension) {
    const nextPosition = {
      ...world.position,
      y: Math.min(HEIGHTS[dim][1], Math.max(HEIGHTS[dim][0], world.position.y)),
    };
    const next = { ...world, position: nextPosition };
    const nextTypes = STRUCTURES.filter((item) => item.dimension === dim)
      .slice(0, 3)
      .map((item) => item.id);
    const nextBiome = BIOMES.find((b) => b.dimension === dim)?.id ?? 1;
    setDimension(dim);
    setPosition(nextPosition);
    setWorld(next);
    setTypes(nextTypes);
    setBiome(nextBiome);
    runSearch(next, dim, nextTypes, page === 'biomes' ? nextBiome : undefined);
  }
  function openWorld(item: World) {
    setWorld(item);
    setSeedInput(item.seedInput);
    setVersion(item.version);
    setPosition(item.position);
    setPage('explorer');
    setDimension('overworld');
    setTypes([5, 11, 13]);
    runSearch(item, 'overworld', [5, 11, 13]);
  }
  async function saveDialog(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      if (dialog === 'world') {
        await persist({ ...world, name: name.trim().slice(0, 100) });
        setStatus('World saved on this device.');
      }
      if (dialog === 'waypoint' && point) {
        await persist({
          ...world,
          waypoints: [
            ...world.waypoints,
            { id: crypto.randomUUID(), name: name.trim().slice(0, 100), dimension, ...point },
          ],
        });
        setStatus('Waypoint saved on this device.');
      }
      setDialog(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your changes.');
    }
  }
  async function markExplored(discovery: Discovery) {
    const progress = { ...world.progress };
    if (progress[discovery.id]) delete progress[discovery.id];
    else progress[discovery.id] = 'explored';
    try {
      await persist({ ...world, progress });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save progress.');
    }
  }
  function cancel() {
    activeWorker.current?.terminate();
    activeRequest.current = '';
    setBusy(false);
    setStatus('Search cancelled. Results shown are partial.');
  }
  function go(id: Page) {
    setPage(id);
    setMobileNav(false);
    setSelected(null);
    setResults([]);
    setHasSearched(false);
    activeWorker.current?.terminate();
    activeRequest.current = '';
    setBusy(false);
    if (id === 'explorer' || id === 'structures') runSearch(world, dimension, types);
  }
  const pageTitle = PAGES.find((item) => item.id === page)?.name ?? 'Settings';
  return (
    <div className={`app-shell ${mobileNav ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            go('explorer');
          }}
          aria-label="SeedAtlas home"
        >
          <span className="brand-mark">
            <Mountain size={26} strokeWidth={1.8} />
          </span>
          <span>
            seed<span className="brand-light">atlas</span>
            <small>MINECRAFT, MAPPED.</small>
          </span>
        </a>
        <div className="workspace-label">YOUR FIELD NOTES</div>
        <nav aria-label="Main navigation">
          {PAGES.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => go(id)}
            >
              <Icon size={18} strokeWidth={1.65} />
              <span>{name}</span>
              {id === 'saved' && world.waypoints.length > 0 && (
                <small>{world.waypoints.length}</small>
              )}
              {page === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-rule" />
        <div className="sidebar-world-heading">
          CURRENT WORLD
          <button
            aria-label="Save current world"
            onClick={() => {
              setName(world.name);
              setDialog('world');
            }}
          >
            <Plus size={15} />
          </button>
        </div>
        <button className="current-world" onClick={() => go('worlds')}>
          <span className="world-thumbnail">
            <Sprout size={20} />
          </span>
          <span>
            {world.name}
            <small>
              Java {world.version} <i>·</i> {saved ? 'Saved locally' : 'Example seed'}
            </small>
          </span>
          <ChevronRight size={13} />
        </button>
        <div className="sidebar-bottom">
          <div className="browser-note">
            <span className="note-illustration">
              <Leaf size={25} strokeWidth={1.2} />
              <span>✦</span>
            </span>
            <strong>Your world. Your device.</strong>
            <p>Explore freely. Your seeds and field notes stay with you.</p>
            <span>
              <ShieldCheck size={12} /> No account needed
            </span>
          </div>
          <button
            className={`nav-item ${page === 'settings' ? 'active' : ''}`}
            onClick={() => go('settings')}
          >
            <Settings2 size={17} />
            Settings
          </button>
          <a
            className="nav-item source-link"
            href="https://github.com/Praashon/seedatlas"
            target="_blank"
            rel="noreferrer"
          >
            <GitFork size={17} />
            Open source
            <ArrowRight size={13} />
          </a>
          <div className="guest-profile">
            <span>G</span>
            <div>
              Guest explorer<small>Stored on this device</small>
            </div>
            <span className="guest-dot" />
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <main>
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              <span className="breadcrumb-root">Workspace</span>
              <ChevronRight size={12} />
              <b>{pageTitle}</b>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="local-badge">
              <span />
              {online ? 'Running locally' : 'Offline · local mode'}
            </span>
            <button
              className="icon-button"
              aria-label="Help and accuracy"
              onClick={() => setDialog('help')}
            >
              <CircleHelp size={18} />
            </button>
            <span className="avatar">G</span>
          </div>
        </header>
        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">A WORLD WORTH EXPLORING</div>
              <h1>
                {pageTitle}
                <span className="title-period">.</span>
              </h1>
              <p>
                {page === 'worlds'
                  ? 'A place for every world you call home.'
                  : page === 'saved'
                    ? 'Good places are worth remembering.'
                    : page === 'ores'
                      ? 'A more thoughtful way to plan your next mining trip.'
                      : page === 'settings'
                        ? 'Make yourself at home.'
                        : 'Start with a seed. See where it takes you.'}
              </p>
            </div>
            <div className="heading-actions">
              <span className="edition-label">
                <span className="tiny-cube" />
                JAVA EDITION
              </span>
              <button
                className="button secondary"
                onClick={() => {
                  setName(world.name);
                  setDialog('world');
                }}
              >
                {saved ? <Check size={15} /> : <Plus size={15} />}
                {saved ? 'Save world' : 'Save this world'}
              </button>
            </div>
          </section>
          {error && (
            <div className="alert error" role="alert">
              <TriangleAlert size={17} />
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                <X size={15} />
              </button>
            </div>
          )}
          {status && (
            <div className="alert success" role="status">
              <Check size={16} />
              <span>{status}</span>
              <button aria-label="Dismiss notification" onClick={() => setStatus('')}>
                <X size={15} />
              </button>
            </div>
          )}
          {['explorer', 'structures', 'biomes'].includes(page) && (
            <>
              <form className="world-form" onSubmit={applyWorld}>
                <label className="seed-field">
                  <span>
                    <Sprout size={13} />
                    WORLD SEED
                  </span>
                  <input
                    aria-label="World seed"
                    value={seedInput}
                    onChange={(event) => setSeedInput(event.target.value)}
                    placeholder="A number or a seed phrase"
                    required
                    maxLength={1024}
                  />
                  <button
                    type="button"
                    className="copy-seed"
                    aria-label="Copy canonical seed"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(world.seed)
                        .then(() => setStatus('Seed copied.'))
                        .catch(() =>
                          setError(
                            'Clipboard access is unavailable. Select and copy the seed manually.',
                          ),
                        );
                    }}
                  >
                    <Copy size={14} />
                  </button>
                </label>
                <label className="version-field">
                  <span>GAME VERSION</span>
                  <select
                    aria-label="Game version"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                  >
                    {VersionCapabilityRegistry.map((item) => (
                      <option key={item.id} value={item.id}>
                        Java {item.id}
                        {item.engineVersion === null ? ' · pending' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="position-field">
                  <span>YOUR POSITION</span>
                  <div>
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <label key={axis}>
                        <span>{axis.toUpperCase()}</span>
                        <input
                          aria-label={`Player ${axis.toUpperCase()}`}
                          type="number"
                          step="1"
                          value={Number.isNaN(position[axis]) ? '' : position[axis]}
                          onChange={(event) =>
                            setPosition((p) => ({ ...p, [axis]: event.target.valueAsNumber }))
                          }
                          required
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <button className="button primary generate" type="submit">
                  <Compass size={16} />
                  Explore seed
                  <ArrowRight size={15} />
                </button>
              </form>
              <div className="exploration-layout">
                <div className="map-column">
                  <div className="map-toolbar">
                    <div className="dimension-tabs" aria-label="Dimension">
                      {(['overworld', 'nether', 'end'] as const).map((dim) => (
                        <button
                          key={dim}
                          className={dimension === dim ? 'active' : ''}
                          onClick={() => changeDimension(dim)}
                        >
                          {dim === 'overworld' ? (
                            <Globe2 size={14} />
                          ) : dim === 'nether' ? (
                            <Layers2 size={14} />
                          ) : (
                            <Diamond size={14} />
                          )}
                          {dim === 'end' ? 'The End' : dim[0].toUpperCase() + dim.slice(1)}
                        </button>
                      ))}
                    </div>
                    <span className="map-profile">
                      Default generation
                      <ChevronDown size={12} />
                    </span>
                  </div>
                  <AtlasMap
                    seed={world.seed}
                    version={world.version}
                    dimension={dimension}
                    position={world.position}
                    supported={supported}
                    radius={radius}
                    results={visibleResults}
                    selected={selected}
                    waypoints={world.waypoints}
                    onSelect={setSelected}
                    onPoint={(value) => {
                      setPoint(value);
                      setName('');
                      setDialog('waypoint');
                    }}
                  />
                  <div className="map-footer">
                    <div>
                      <span className="legend-dot forest" />
                      Forest
                      <span className="legend-dot plains" />
                      Plains
                      <span className="legend-dot water" />
                      Water
                      <span className="legend-dot special" />
                      Other biomes
                    </div>
                    <button onClick={() => setDialog('help')}>
                      About this map
                      <CircleHelp size={12} />
                    </button>
                  </div>
                  <div className="field-note">
                    <span className="field-note-icon">
                      <Compass size={26} strokeWidth={1.25} />
                    </span>
                    <div>
                      <strong>A seed is all you need.</strong>
                      <p>
                        Biomes and structure predictions run right here in your browser. No mod, no
                        account, no detours.
                      </p>
                    </div>
                    <span className="field-note-badge">
                      FREE TO EXPLORE
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
                <aside className="discoveries-panel">
                  <div className="discoveries-heading">
                    <div>
                      <span className="eyebrow">OUT THERE, WAITING</span>
                      <h2>
                        {page === 'biomes' ? 'Find a biome' : 'Nearby discoveries'}
                        <span>{visibleResults.length.toString().padStart(2, '0')}</span>
                      </h2>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Search filters"
                      onClick={() => setFilters(!filters)}
                    >
                      <SlidersHorizontal size={17} />
                    </button>
                  </div>
                  {page === 'biomes' ? (
                    <div className="biome-selector">
                      <label>
                        LOOKING FOR
                        <select
                          aria-label="Biome"
                          value={biome}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            setBiome(next);
                            if ([174, 175, 183, 187].includes(next) && world.position.y > 0) {
                              const underground = { ...world.position, y: 0 };
                              setPosition(underground);
                              setWorld({ ...world, position: underground });
                            }
                          }}
                        >
                          {BIOMES.filter(
                            (b) =>
                              b.dimension === dimension &&
                              (![186, 187].includes(b.id) || world.version === '26.2') &&
                              !(world.version === '1.18.2' && [183, 184, 185].includes(b.id)),
                          ).map((b) => (
                            <option value={b.id} key={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Sampling spacing
                        <select
                          aria-label="Sampling spacing"
                          value={resolution}
                          onChange={(event) => setResolution(Number(event.target.value))}
                        >
                          {[16, 32, 64, 128].map((n) => (
                            <option key={n} value={n}>
                              Every {n} blocks
                            </option>
                          ))}
                        </select>
                      </label>
                      <p>Searches the nearest sampled match at Y {world.position.y}.</p>
                      {biome === 187 && (
                        <p>
                          Sulfur caves are underground. Sampling starts at Y 0; adjust your position
                          height to explore another layer.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="filter-chips">
                      {available.slice(0, filters ? available.length : 3).map((item) => (
                        <button
                          key={item.id}
                          aria-pressed={types.includes(item.id)}
                          className={types.includes(item.id) ? 'active' : ''}
                          onClick={() =>
                            setTypes((current) =>
                              current.includes(item.id)
                                ? current.filter((t) => t !== item.id)
                                : [...current, item.id],
                            )
                          }
                        >
                          <span style={{ background: item.color }} />
                          {item.name}
                        </button>
                      ))}
                      <button
                        className="more-filter"
                        aria-label={filters ? 'Fewer structure filters' : 'More structure filters'}
                        onClick={() => setFilters(!filters)}
                      >
                        {filters ? <MinusIcon /> : <Plus size={13} />}
                      </button>
                    </div>
                  )}
                  <div className="search-options">
                    <label>
                      WITHIN
                      <select
                        aria-label="Search radius"
                        value={radius}
                        onChange={(event) => setRadius(Number(event.target.value))}
                      >
                        {[512, 1024, 2048, 4096].map((n) => (
                          <option key={n} value={n}>
                            {n.toLocaleString()} blocks
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="button search-button"
                      disabled={!supported || (!types.length && page !== 'biomes')}
                      onClick={() =>
                        busy
                          ? cancel()
                          : runSearch(
                              world,
                              dimension,
                              types,
                              page === 'biomes' ? biome : undefined,
                            )
                      }
                    >
                      {busy ? <X size={14} /> : <Search size={14} />}
                      {busy ? 'Cancel' : 'Find nearby'}
                    </button>
                  </div>
                  {busy && (
                    <div
                      className="search-progress"
                      role="progressbar"
                      aria-label="Search progress"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: `${Math.max(5, progress)}%` }} />
                    </div>
                  )}
                  <div className="result-summary">
                    <span>
                      {busy
                        ? `Searching · ${progress}%`
                        : hasSearched
                          ? `${visibleResults.length} ${page === 'biomes' ? 'sampled match' : 'predictions'} found`
                          : 'Ready to explore'}
                    </span>
                    <label>
                      <input
                        type="checkbox"
                        checked={hideExplored}
                        onChange={(event) => setHideExplored(event.target.checked)}
                      />
                      Hide visited
                    </label>
                  </div>
                  <div className="results-list">
                    {visibleResults.map((item) => (
                      <button
                        key={item.id}
                        className={`discovery-card ${selected?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      >
                        <span
                          className="discovery-icon"
                          style={
                            {
                              '--feature-color':
                                STRUCTURES.find((s) => s.id === item.type)?.color ?? '#a6bc87',
                            } as React.CSSProperties
                          }
                        >
                          {item.type === -1 ? (
                            <Trees size={19} strokeWidth={1.6} />
                          ) : item.type === 5 ? (
                            <Folder size={19} strokeWidth={1.6} />
                          ) : item.type === 13 ? (
                            <Layers2 size={19} strokeWidth={1.6} />
                          ) : (
                            <MapPin size={19} strokeWidth={1.6} />
                          )}
                        </span>
                        <span className="discovery-copy">
                          <strong>
                            {item.name}
                            {world.progress[item.id] && <Check size={12} />}
                          </strong>
                          <span>
                            X {item.x.toLocaleString()} <i>·</i> Z {item.z.toLocaleString()}
                          </span>
                          <small>
                            {item.biome} at Y {world.position.y} <span>· Predicted</span>
                          </small>
                        </span>
                        <span className="discovery-distance">
                          {Math.round(item.distance).toLocaleString()}
                          <small>blocks</small>
                          <ChevronRight size={13} />
                        </span>
                      </button>
                    ))}
                    {!visibleResults.length && !busy && (
                      <div className="empty-search">
                        <Map size={33} strokeWidth={1} />
                        <strong>
                          {hasSearched
                            ? 'A little further, perhaps?'
                            : page === 'biomes'
                              ? 'Find your kind of place.'
                              : 'Pick a direction.'}
                        </strong>
                        <p>
                          {hasSearched
                            ? page === 'biomes'
                              ? 'No match at the sampled points. Try another height, smaller spacing, or a wider radius.'
                              : 'No predictions within this radius and filter. Try widening your search.'
                            : 'Choose what you want to find, then search the surrounding world.'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="result-footnote">
                    <ShieldCheck size={14} />
                    <span>
                      Predicted from your seed.
                      <br />
                      <button onClick={() => setDialog('help')}>
                        Know the limits before you go
                        <ArrowRight size={11} />
                      </button>
                    </span>
                  </div>
                </aside>
              </div>
              {selected && (
                <section className="selected-panel">
                  <div className="selected-title">
                    <Flag size={19} />
                    <div>
                      <span className="eyebrow">YOUR NEXT STOP</span>
                      <h2>{selected.name}</h2>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Close discovery"
                      onClick={() => setSelected(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="selected-coordinate">
                    X <b>{selected.x}</b>
                    <span>
                      Y <b>{selected.y ?? 'Unknown'}</b>
                    </span>
                    Z <b>{selected.z}</b>
                  </div>
                  <p>
                    {Math.round(selected.distance).toLocaleString()} blocks straight-line ·{' '}
                    {
                      navigation(world.position, { ...selected, y: selected.y ?? world.position.y })
                        .direction
                    }{' '}
                    · {selected.dimension}
                  </p>
                  <p className="selected-caveat">{selected.limitations.join(' ')}</p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setPoint({ x: selected.x, y: selected.y ?? world.position.y, z: selected.z });
                      setName(selected.name);
                      setDialog('waypoint');
                    }}
                  >
                    <Bookmark size={14} />
                    Save waypoint
                  </button>
                  <button className="button secondary" onClick={() => markExplored(selected)}>
                    <Check size={14} />
                    {world.progress[selected.id] ? 'Undo visited' : 'Mark visited'}
                  </button>
                </section>
              )}
            </>
          )}
          {page === 'worlds' && (
            <section className="collection-view">
              <div className="collection-toolbar">
                <span>
                  {worlds.length} saved {worlds.length === 1 ? 'world' : 'worlds'} on this device
                </span>
                <button
                  className="button secondary"
                  onClick={() => exportJson('seedatlas-worlds.json', { schema: 1, worlds })}
                >
                  <ArrowDownToLine size={15} />
                  Export all
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    const next = newWorld();
                    openWorld(next);
                    setStatus('New unsaved world. Enter your seed to begin.');
                  }}
                >
                  <Plus size={15} />
                  New world
                </button>
              </div>
              {worlds.length ? (
                <div className="world-grid">
                  {worlds.map((item) => (
                    <button className="world-card" key={item.id} onClick={() => openWorld(item)}>
                      <div className="world-card-art">
                        <Mountain size={66} strokeWidth={0.65} />
                        <span>JAVA {item.version}</span>
                      </div>
                      <h2>{item.name}</h2>
                      <p>Seed {item.seed}</p>
                      <span>
                        {item.waypoints.length} saved places
                        <ArrowRight size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Globe2 size={45} strokeWidth={1} />}
                  title="Your atlas starts here."
                  text="Save your current world to keep its seed, waypoints, and exploration progress together."
                  action={
                    <button
                      className="button primary"
                      onClick={() => {
                        setName(world.name);
                        setDialog('world');
                      }}
                    >
                      Save your first world
                      <Plus size={15} />
                    </button>
                  }
                />
              )}
            </section>
          )}
          {page === 'saved' && (
            <section className="collection-view">
              <div className="collection-toolbar">
                <span>
                  {world.name} · {world.waypoints.length} saved places
                </span>
                <button
                  className="button secondary"
                  onClick={() =>
                    exportJson('seedatlas-waypoints.json', {
                      schema: 1,
                      worldId: world.id,
                      waypoints: world.waypoints,
                    })
                  }
                >
                  <ArrowDownToLine size={15} />
                  Export waypoints
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setPoint(world.position);
                    setName('');
                    setDialog('waypoint');
                  }}
                >
                  <Plus size={15} />
                  Add waypoint
                </button>
              </div>
              {world.waypoints.length ? (
                <div className="waypoint-list">
                  {world.waypoints.map((item) => (
                    <article key={item.id}>
                      <span className="waypoint-list-icon">
                        <Flag size={21} />
                      </span>
                      <div>
                        <h2>{item.name}</h2>
                        <p>
                          {item.dimension} · X {item.x} · Y {item.y} · Z {item.z}
                        </p>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() => {
                          setDimension(item.dimension);
                          const next = { ...world, position: { x: item.x, y: item.y, z: item.z } };
                          setPosition(next.position);
                          setWorld(next);
                          setPage('explorer');
                          setResults([]);
                          setHasSearched(false);
                        }}
                      >
                        View on map
                        <ArrowRight size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Bookmark size={45} strokeWidth={1} />}
                  title="Leave yourself a little reminder."
                  text="Select a discovery or click the map to save a place worth coming back to."
                  action={
                    <button className="button primary" onClick={() => go('explorer')}>
                      Back to the atlas
                      <ArrowRight size={15} />
                    </button>
                  }
                />
              )}
            </section>
          )}
          {page === 'ores' && <OreGuide />}
          {page === 'settings' && (
            <div className="settings-grid">
              <section className="settings-card">
                <Sun size={25} strokeWidth={1.3} />
                <h2>A change of light</h2>
                <p>The field atlas comes in ink and parchment.</p>
                <button className="button secondary" onClick={() => setDark(!dark)}>
                  Use {dark ? 'light' : 'dark'} appearance
                  <Sun size={15} />
                </button>
              </section>
              <section className="settings-card">
                <ShieldCheck size={25} strokeWidth={1.3} />
                <h2>Private by default</h2>
                <p>
                  Worlds and waypoints live in this browser's IndexedDB. No trackers, accounts, or
                  server uploads.
                </p>
                <button
                  className="button secondary"
                  onClick={() => exportJson('seedatlas-backup.json', { schema: 1, worlds })}
                >
                  Download your worlds
                  <ArrowDownToLine size={15} />
                </button>
              </section>
              <section className="settings-card">
                <SlidersHorizontal size={25} strokeWidth={1.3} />
                <h2>A comfortable pace</h2>
                <p>
                  Searches use one worker, a 4,096 block maximum radius, and bounded sampling.
                  Cancel any running search.
                </p>
                <label>
                  Search radius
                  <select
                    value={radius}
                    onChange={(event) => setRadius(Number(event.target.value))}
                  >
                    {[512, 1024, 2048, 4096].map((n) => (
                      <option value={n} key={n}>
                        {n} blocks
                      </option>
                    ))}
                  </select>
                </label>
              </section>
              <section className="settings-card">
                <Compass size={25} strokeWidth={1.3} />
                <h2>A companion, when it helps</h2>
                <p>
                  Live coordinates and verified blocks will use an optional local integration. The
                  companion and precision runner are not implemented yet. Browser biome and
                  structure search works independently.
                </p>
                <span className="status-tag">PLANNED · OPTIONAL</span>
              </section>
              <section className="settings-card full-width">
                <h2>Version field notes</h2>
                <div className="compatibility-table">
                  {VersionCapabilityRegistry.map((item) => (
                    <div key={item.id}>
                      <strong>Java {item.id}</strong>
                      <span
                        className={`status-tag ${item.engineVersion !== null ? 'predicted' : ''}`}
                      >
                        {item.biomes === 'predicted' ? 'PREDICTED' : 'PENDING ADAPTER'}
                      </span>
                      <p>{item.limitations[0]}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
          <footer className="page-footer">
            <span>
              <Mountain size={13} />
              Made for the curious.
            </span>
            <span>
              Free. Open source. Unofficial.<span className="footer-separator">/</span>Not
              affiliated with Mojang or Microsoft.
            </span>
            <span>
              SEEDATLAS <b>v0.1</b>
            </span>
          </footer>
        </div>
      </main>
      <dialog
        ref={modal}
        onCancel={() => setDialog(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDialog(null);
        }}
      >
        <button
          className="dialog-close icon-button"
          aria-label="Close dialog"
          onClick={() => setDialog(null)}
        >
          <X size={20} />
        </button>
        {dialog === 'help' ? (
          <div className="help-content">
            <Compass size={34} strokeWidth={1.2} />
            <span className="eyebrow">A FEW FIELD NOTES</span>
            <h2>An honest kind of atlas.</h2>
            <p>
              Biomes and structures are calculated locally by Cubiomes, not looked up in a database.
              Results are predictions. Independent vanilla reference validation is still pending.
            </p>
            <p>
              Some structures need terrain checks that the browser engine cannot complete. Structure
              altitude is unknown. Biome maps show a sampled plane at your chosen Y, and scans can
              miss patches between samples.
            </p>
            <p>
              Java 26.2 is available in the browser, including sulfur caves. Other 26.x adapters,
              exact ore simulation, save inspection, accounts, and the optional companion are not
              implemented yet. No unsupported version silently uses another version's generator.
            </p>
            <p>
              Your saved worlds stay on this device. Export a backup before clearing browser data.
            </p>
            <button className="button primary" onClick={() => setDialog(null)}>
              Back to exploring
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <form className="save-dialog" onSubmit={saveDialog}>
            <span className="dialog-icon">
              {dialog === 'world' ? <Globe2 size={28} /> : <Flag size={28} />}
            </span>
            <span className="eyebrow">A NOTE FOR ANOTHER DAY</span>
            <h2>{dialog === 'world' ? 'Give your world a name.' : 'Remember this place.'}</h2>
            <p>
              {dialog === 'world'
                ? 'Your seed and field notes, kept together on this device.'
                : `${dimension} · X ${point?.x} · Y ${point?.y} · Z ${point?.z}`}
            </p>
            <label>
              {dialog === 'world' ? 'World name' : 'Waypoint name'}
              <input
                autoFocus
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={dialog === 'world' ? 'Sunday survival' : 'A place to come back to'}
              />
            </label>
            {dialog === 'waypoint' && (
              <p>This is a planning waypoint. Y is not verified from world blocks.</p>
            )}
            <button type="submit" className="button primary">
              {dialog === 'world' ? 'Save world' : 'Save waypoint'}
              <Check size={16} />
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}
function MinusIcon() {
  return <span aria-hidden="true">−</span>;
}
