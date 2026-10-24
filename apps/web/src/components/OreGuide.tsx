import { useState } from 'react';
import { Diamond, ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react';
export function OreGuide() {
  const [material, setMaterial] = useState('diamond');
  const entries: Record<string, { name: string; color: string; note: string; detail: string }> = {
    diamond: {
      name: 'Diamond',
      color: '#87bcb2',
      note: 'Start below Y 0.',
      detail:
        'In the 1.18 generation overhaul, diamonds become more common toward the bottom of the Overworld. Reduced air exposure affects deposits. This is general distribution guidance, not a location or block count.',
    },
    iron: {
      name: 'Iron',
      color: '#c0a18d',
      note: 'Look underground or head for the mountains.',
      detail:
        'The 1.18 overhaul gives iron multiple height distributions, including high elevations. Large iron veins are a separate feature. No vein positions or deposit sizes are calculated here.',
    },
    copper: {
      name: 'Copper',
      color: '#be8d6c',
      note: 'Dripstone caves are worth a look.',
      detail:
        'The 1.18 overhaul adds larger copper deposits in dripstone caves. Large copper veins differ from ordinary deposits. This educational guide cannot verify individual blocks.',
    },
    gold: {
      name: 'Gold',
      color: '#d9bd73',
      note: 'Consider a badlands expedition.',
      detail:
        'Badlands have additional gold generation. Nether gold is a separate block and generation profile. The atlas currently provides no exact ore coordinates.',
    },
  };
  const entry = entries[material];
  return (
    <div className="ore-layout">
      <section className="ore-materials">
        <span className="eyebrow">CHOOSE YOUR MATERIAL</span>
        {Object.entries(entries).map(([id, item]) => (
          <button
            className={material === id ? 'active' : ''}
            key={id}
            onClick={() => setMaterial(id)}
          >
            <Diamond size={19} style={{ color: item.color }} />
            {item.name}
            <ChevronRight size={14} />
          </button>
        ))}
      </section>
      <section className="ore-story">
        <span className="status-tag predicted">DISTRIBUTION GUIDANCE · JAVA 1.18 OVERHAUL</span>
        <Diamond size={80} strokeWidth={0.7} style={{ color: entry.color }} />
        <h2>{entry.name}, with a little direction.</h2>
        <h3>{entry.note}</h3>
        <p>{entry.detail}</p>
        <a
          href="https://feedback.minecraft.net/hc/en-us/articles/4415128577293-Minecraft-Java-Edition-1-18"
          target="_blank"
          rel="noreferrer"
        >
          Read the original generation notes
          <ArrowRight size={14} />
        </a>
        <div className="ore-honesty">
          <ShieldCheck size={20} />
          <div>
            <strong>Coordinates need evidence.</strong>
            <p>
              Exact ore search will require a validated precision adapter or inspected world blocks.
              Neither is available in this release. These notes are not a 26.x distribution chart.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
