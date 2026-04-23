"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface LLMProvider {
  id: string;
  name: string;
  created_datetime_utc?: string;
}

export default function LLMProvidersPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
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

    const { data, error, count } = await supabase
      .from("llm_providers")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching providers:", error);
    } else {
      setProviders(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleSubmit() {
    if (!newName) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    if (isAdding) {
      const { error } = await supabase.from("llm_providers").insert([{ 
        name: newName,
        created_by_user_id: user.id,
        modified_by_user_id: user.id
      }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingProvider) {
      const { error } = await supabase.from("llm_providers").update({ 
        name: newName,
        modified_by_user_id: user.id
      }).eq("id", editingProvider.id);
      if (error) alert(error.message);
      else { setEditingProvider(null); fetchData(); }
    }
    setNewName("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete provider?")) return;
    const { error } = await supabase.from("llm_providers").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

interface LLMProvider {
...
  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>LLM Providers</h1>
          <p className={styles.dashboardSubtitle}>Manage AI service providers (e.g., OpenAI, Anthropic).</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingProvider(null); setNewName(""); }}
          className={tableStyles.addButton}
        >
          + Add Provider
        </button>
      </div>

      {(isAdding || editingProvider) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{isAdding ? "Add New Provider" : "Edit Provider"}</h2>
          <div className={tableStyles.formGrid}>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Provider Name</label>
              <input 
                type="text" 
                placeholder="Provider Name" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={tableStyles.input}
              />
            </div>
            <div className={tableStyles.buttonGroup}>
              <button 
                onClick={handleSubmit}
                className={tableStyles.saveButton}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingProvider(null); }}
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
          <p>Loading providers...</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>NAME</th>
                <th className={tableStyles.th}>ID</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`} style={{ fontWeight: 'bold' }}>{provider.name}</td>
                  <td className={tableStyles.td} style={{ fontSize: '11px', fontFamily: 'monospace' }}>{provider.id}</td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => { setEditingProvider(provider); setNewName(provider.name); setIsAdding(false); }}
                        className={tableStyles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(provider.id)}
                        className={tableStyles.deleteButton}
                      >
                        Delete
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
