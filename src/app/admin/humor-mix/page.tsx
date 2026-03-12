"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface HumorFlavor {
  id: string;
  slug: string;
}

interface HumorFlavorMix {
  id: string;
  created_datetime_utc: string;
  humor_flavor_id: string;
  caption_count: number;
}

export default function HumorMixPage() {
  const [mixes, setMixes] = useState<HumorFlavorMix[]>([]);
  const [flavors, setFlavors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingMix, setEditingMix] = useState<HumorFlavorMix | null>(null);
  const [newCaptionCount, setNewCaptionCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch flavors for mapping IDs to slugs
    const { data: flavorData } = await supabase
      .from("humor_flavors")
      .select("id, slug");
    
    if (flavorData) {
      const flavorMap: Record<string, string> = {};
      flavorData.forEach(f => flavorMap[f.id] = f.slug);
      setFlavors(flavorMap);
    }

    // Fetch the mix
    const { data, error } = await supabase
      .from("humor_flavor_mix")
      .select("*")
      .order("created_datetime_utc", { ascending: false });

    if (error) {
      console.error("Error fetching humor mix:", error);
    } else {
      setMixes(data || []);
    }
    setLoading(false);
  }

  async function handleUpdateMix() {
    if (!editingMix) return;
    
    const { error } = await supabase
      .from("humor_flavor_mix")
      .update({ caption_count: newCaptionCount })
      .eq("id", editingMix.id);

    if (error) {
      alert("Error updating mix: " + error.message);
    } else {
      setEditingMix(null);
      fetchData();
    }
  }

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Humor Mix Management</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Control the number of captions generated per humor flavor.</p>
      </div>

      {editingMix && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Edit Mix: {flavors[editingMix.humor_flavor_id]?.toUpperCase() || editingMix.humor_flavor_id}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px', color: '#888' }}>Caption Count</label>
            <input 
              type="number" 
              value={newCaptionCount}
              onChange={(e) => setNewCaptionCount(parseInt(e.target.value) || 0)}
              style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={handleUpdateMix}
                style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Update
              </button>
              <button 
                onClick={() => setEditingMix(null)}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading mix data...</p>
        ) : mixes.length === 0 ? (
          <p>No mix data found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Flavor</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Caption Count</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Created (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mixes.map((mix) => (
                  <tr key={mix.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4ade80' }}>
                      {flavors[mix.humor_flavor_id]?.toUpperCase() || mix.humor_flavor_id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '18px', color: '#fff' }}>
                      {mix.caption_count}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
                      {new Date(mix.created_datetime_utc).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => { setEditingMix(mix); setNewCaptionCount(mix.caption_count); }}
                        style={{ padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
