"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface SignupDomain {
  id: string;
  apex_domain: string;
  created_datetime_utc?: string;
}

export default function SignupDomainsPage() {
  const [domains, setDomains] = useState<SignupDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDomain, setEditingDomain] = useState<SignupDomain | null>(null);
  const [newDomain, setNewDomain] = useState("");
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("allowed_signup_domains")
      .select("*")
      .order("apex_domain", { ascending: true });

    if (error) {
      console.error("Error fetching domains:", error);
    } else {
      setDomains(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newDomain) return;

    if (isAdding) {
      const { error } = await supabase.from("allowed_signup_domains").insert([{ apex_domain: newDomain }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingDomain) {
      const { error } = await supabase.from("allowed_signup_domains").update({ apex_domain: newDomain }).eq("id", editingDomain.id);
      if (error) alert(error.message);
      else { setEditingDomain(null); fetchData(); }
    }
    setNewDomain("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete domain?")) return;
    const { error } = await supabase.from("allowed_signup_domains").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Signup Domains</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Domains allowed to register (e.g., company.com).</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingDomain(null); setNewDomain(""); }}
          style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Domain
        </button>
      </div>

      {(isAdding || editingDomain) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2>{isAdding ? "Add New Domain" : "Edit Domain"}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="e.g. google.com" 
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
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
                onClick={() => { setIsAdding(false); setEditingDomain(null); }}
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
          <p>Loading domains...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>DOMAIN</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CREATED (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{domain.apex_domain}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
                      {domain.created_datetime_utc ? new Date(domain.created_datetime_utc).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => { setEditingDomain(domain); setNewDomain(domain.apex_domain); setIsAdding(false); }}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(domain.id)}
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
