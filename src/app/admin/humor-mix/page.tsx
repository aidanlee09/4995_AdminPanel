"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  async function fetchData() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    
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
    const { data, error, count } = await supabase
      .from("humor_flavor_mix")
      .select("*", { count: "exact" })
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching humor mix:", error);
    } else {
      setMixes(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleUpdateMix() {
    if (!editingMix) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }
    
    const { error } = await supabase
      .from("humor_flavor_mix")
      .update({ 
        caption_count: newCaptionCount,
        modified_by_user_id: user.id
      })
      .eq("id", editingMix.id);

    if (error) {
      alert("Error updating mix: " + error.message);
    } else {
      setEditingMix(null);
      fetchData();
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Humor Mix Management</h1>
          <p className={styles.dashboardSubtitle}>Control the number of captions generated per humor flavor.</p>
        </div>
      </div>

      {editingMix && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>
            Edit Mix: {flavors[editingMix.humor_flavor_id]?.toUpperCase() || editingMix.humor_flavor_id}
          </h2>
          <div className={tableStyles.formGrid}>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Caption Count</label>
              <input 
                type="number" 
                value={newCaptionCount}
                onChange={(e) => setNewCaptionCount(parseInt(e.target.value) || 0)}
                className={tableStyles.input}
              />
            </div>
            <div className={tableStyles.buttonGroup}>
              <button 
                onClick={handleUpdateMix}
                className={tableStyles.saveButton}
              >
                Update
              </button>
              <button 
                onClick={() => setEditingMix(null)}
                className={tableStyles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading mix data...</p>
        ) : mixes.length === 0 ? (
          <p>No mix data found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Flavor</th>
                <th className={tableStyles.th}>Caption Count</th>
                <th className={tableStyles.th}>Created (UTC)</th>
                <th className={tableStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mixes.map((mix) => (
                <tr key={mix.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`} style={{ fontWeight: 'bold', color: '#4ade80' }}>
                    {flavors[mix.humor_flavor_id]?.toUpperCase() || mix.humor_flavor_id}
                  </td>
                  <td className={tableStyles.td} style={{ fontSize: '18px', color: '#fff' }}>
                    {mix.caption_count}
                  </td>
                  <td className={tableStyles.td}>
                    {new Date(mix.created_datetime_utc).toLocaleString()}
                  </td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => { setEditingMix(mix); setNewCaptionCount(mix.caption_count); }}
                        className={tableStyles.editButton}
                        style={{ color: '#4ade80', borderColor: '#333' }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className={tableStyles.pagination}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className={`${tableStyles.pageButton} ${currentPage === 1 ? tableStyles.pageButtonDisabled : tableStyles.pageButtonEnabled}`}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#888' }}>
            Page {currentPage} of {totalPages} ({totalCount} total)
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className={`${tableStyles.pageButton} ${currentPage === totalPages ? tableStyles.pageButtonDisabled : tableStyles.pageButtonEnabled}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
