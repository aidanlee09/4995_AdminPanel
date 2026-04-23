"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface AllowedDomain {
  id: string;
  apex_domain: string;
  created_datetime_utc?: string;
}

export default function SignupDomainsPage() {
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDomain, setEditingDomain] = useState<AllowedDomain | null>(null);
  const [newDomain, setNewDomain] = useState("");
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
      .from("allowed_signup_domains")
      .select("*", { count: "exact" })
      .order("apex_domain", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching allowed_signup_domains:", error);
    } else {
      setDomains(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleSubmit() {
    if (!newDomain) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    if (isAdding) {
      const { error } = await supabase.from("allowed_signup_domains").insert([{ 
        apex_domain: newDomain,
        created_by_user_id: user.id,
        modified_by_user_id: user.id
      }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingDomain) {
      const { error } = await supabase.from("allowed_signup_domains").update({ 
        apex_domain: newDomain,
        modified_by_user_id: user.id
      }).eq("id", editingDomain.id);
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
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Signup Domains</h1>
          <p className={styles.dashboardSubtitle}>Domains allowed to register (e.g., company.com).</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingDomain(null); setNewDomain(""); }}
          className={tableStyles.addButton}
        >
          + Add Domain
        </button>
      </div>

      {(isAdding || editingDomain) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{isAdding ? "Add New Domain" : "Edit Domain"}</h2>
          <div className={tableStyles.formGrid}>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Domain Apex (e.g. google.com)</label>
              <input 
                type="text" 
                placeholder="e.g. google.com" 
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
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
                onClick={() => { setIsAdding(false); setEditingDomain(null); }}
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
          <p>Loading domains...</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>DOMAIN</th>
                <th className={tableStyles.th}>CREATED (UTC)</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`} style={{ fontWeight: 'bold' }}>{domain.apex_domain}</td>
                  <td className={tableStyles.td}>
                    {domain.created_datetime_utc ? new Date(domain.created_datetime_utc).toLocaleString() : 'N/A'}
                  </td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => { setEditingDomain(domain); setNewDomain(domain.apex_domain); setIsAdding(false); }}
                        className={tableStyles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(domain.id)}
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
