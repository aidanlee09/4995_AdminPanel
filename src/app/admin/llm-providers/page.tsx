"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("llm_providers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching providers:", error);
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newName) return;

    if (isAdding) {
      const { error } = await supabase.from("llm_providers").insert([{ name: newName }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingProvider) {
      const { error } = await supabase.from("llm_providers").update({ name: newName }).eq("id", editingProvider.id);
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

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>LLM Providers</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Manage AI service providers (e.g., OpenAI, Anthropic).</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingProvider(null); setNewName(""); }}
          style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Provider
        </button>
      </div>

      {(isAdding || editingProvider) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2>{isAdding ? "Add New Provider" : "Edit Provider"}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="Provider Name" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSubmit}
                style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingProvider(null); }}
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
          <p>Loading providers...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>NAME</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ID</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{provider.name}</td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>{provider.id}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => { setEditingProvider(provider); setNewName(provider.name); setIsAdding(false); }}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(provider.id)}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Delete
                        </button>
                      </div>
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
