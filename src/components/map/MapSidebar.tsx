'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { MapRecord } from '@/types';

interface MapSidebarProps {
  open: boolean;
  onToggle: () => void;
  activeMap: MapRecord | null;
  onSelectMap: (map: MapRecord) => void;
  onStyleChange: (style: string) => void;
  onOverlayToggle?: (overlayId: string, enabled: boolean) => void;
}

const basemaps = [
  { id: 'satellite-streets-v12', label: 'Satellite', icon: '\u{1F6F0}\uFE0F' },
  { id: 'streets-v12', label: 'Streets', icon: '\u{1F5FA}\uFE0F' },
  { id: 'outdoors-v12', label: 'Outdoors', icon: '\u{1F3D4}\uFE0F' },
  { id: 'light-v11', label: 'Light', icon: '\u2600\uFE0F' },
];

const overlays = [
  { id: 'contours', label: 'Contour Lines', icon: '\u{1F3D4}\uFE0F', available: true },
  { id: 'counties', label: 'County Lines', icon: '\u{1F5FA}\uFE0F', available: true },
  { id: 'floodplains', label: 'Floodplains', icon: '\u{1F30A}', available: false },
  { id: 'public-lands', label: 'Public Lands', icon: '\u{1F332}', available: false },
  { id: 'schools', label: 'School Districts', icon: '\u{1F3EB}', available: false },
];

export default function MapSidebar({ open, onToggle, activeMap, onSelectMap, onStyleChange, onOverlayToggle }: MapSidebarProps) {
  const supabase = createClient();
  useAuth();
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBasemap, setActiveBasemap] = useState('satellite-streets-v12');
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());
  const [newMapName, setNewMapName] = useState('');
  const [showNewMap, setShowNewMap] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchMaps() {
      setLoading(true);
      const { data } = await supabase
        .from('maps')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(50);
      setMaps((data as MapRecord[]) || []);
      setLoading(false);
    }
    fetchMaps();
  }, [supabase]);

  async function handleCreateMap() {
    if (!newMapName.trim() || creating) return;
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: prof } = await supabase.from('profiles').select('org_id').eq('id', session.user.id).single();

    const { data, error } = await supabase
      .from('maps')
      .insert({
        title: newMapName.trim(),
        owner_id: session.user.id,
        org_id: prof?.org_id ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      const newMap = data as MapRecord;
      setMaps((prev) => [newMap, ...prev]);
      onSelectMap(newMap);
      setShowNewMap(false);
      setNewMapName('');
    }
    setCreating(false);
  }

  function handleBasemapChange(id: string) {
    setActiveBasemap(id);
    onStyleChange(id);
  }

  function handleOverlayChange(overlayId: string) {
    const willBeEnabled = !activeOverlays.has(overlayId);
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(overlayId)) next.delete(overlayId); else next.add(overlayId);
      return next;
    });
    onOverlayToggle?.(overlayId, willBeEnabled);
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 320, zIndex: 15,
    background: 'rgba(15, 20, 40, 0.92)', backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(55, 65, 81, 0.5)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '16px', borderBottom: '1px solid rgba(55, 65, 81, 0.4)',
  };

  const headingStyle: React.CSSProperties = {
    color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };

  return (
    <>
      {/* Sidebar panel */}
      <div style={panelStyle}>
        {/* My Maps section */}
        <div style={sectionStyle}>
          <div style={headingStyle}>
            <span>My Maps</span>
            <button
              onClick={() => setShowNewMap(true)}
              style={{
                background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6,
                padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
              }}
            >+ New</button>
          </div>

          {showNewMap && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateMap()}
                placeholder="Map name..."
                autoFocus
                style={{
                  flex: 1, background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(55, 65, 81, 0.5)',
                  borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={handleCreateMap}
                disabled={creating}
                style={{
                  background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                }}
              >{creating ? '...' : 'Create'}</button>
              <button
                onClick={() => { setShowNewMap(false); setNewMapName(''); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
              >\u00D7</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 44, borderRadius: 8, background: 'rgba(55, 65, 81, 0.3)', animation: 'pulse 2s infinite' }} />
              ))
            ) : maps.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No maps yet</p>
            ) : (
              maps.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMap(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: activeMap?.id === m.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    borderLeft: activeMap?.id === m.id ? '3px solid #3b82f6' : '3px solid transparent',
                    color: '#fff', fontSize: 13, textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (activeMap?.id !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { if (activeMap?.id !== m.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 16 }}>{'\u{1F5FA}\uFE0F'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Basemap section */}
        <div style={sectionStyle}>
          <div style={headingStyle}><span>Basemap</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {basemaps.map((b) => (
              <button
                key={b.id}
                onClick={() => handleBasemapChange(b.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                  background: activeBasemap === b.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  border: activeBasemap === b.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: '#fff', fontSize: 12, transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overlays section */}
        <div style={sectionStyle}>
          <div style={headingStyle}><span>Overlays</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {overlays.map((o) => (
              <label
                key={o.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 8px', borderRadius: 6,
                  cursor: o.available ? 'pointer' : 'default',
                  color: '#fff', fontSize: 13,
                  opacity: o.available ? 1 : 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={activeOverlays.has(o.id)}
                  disabled={!o.available}
                  onChange={() => handleOverlayChange(o.id)}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span>{o.icon}</span>
                <span style={{ flex: 1 }}>{o.label}</span>
                {!o.available && (
                  <span style={{ fontSize: 9, background: 'rgba(55, 65, 81, 0.6)', padding: '2px 6px', borderRadius: 4, color: '#94a3b8' }}>Soon</span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', left: open ? 320 : 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 16, background: 'rgba(15, 20, 40, 0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(55, 65, 81, 0.5)', borderLeft: open ? 'none' : '1px solid rgba(55, 65, 81, 0.5)',
          borderRadius: '0 8px 8px 0',
          padding: '12px 6px', cursor: 'pointer', color: '#94a3b8',
          transition: 'left 0.3s ease',
          boxShadow: '4px 0 16px rgba(0,0,0,0.3)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </>
  );
}
