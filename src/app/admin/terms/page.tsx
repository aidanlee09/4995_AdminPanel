"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface Term {
  id: string;
  term: string;
  definition: string;
  example: string;
  priority: number;
  term_type_id: string;
  created_datetime_utc?: string;
}

interface TermType {
  id: string;
  name: string;
}

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termTypes, setTermTypes] = useState<TermType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Term>>({
    term: "",
    definition: "",
    example: "",
    priority: 0,
    term_type_id: ""
  });
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
    
    const { data: typeData } = await supabase
      .from("term_types")
      .select("id, name");
    setTermTypes(typeData || []);

    const { data, error, count } = await supabase
      .from("terms")
      .select("*", { count: "exact" })
      .order("term", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching terms:", error);
    } else {
      setTerms(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleSubmit() {
    if (!formData.term || !formData.term_type_id) {
      alert("Term and Type are required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    if (isAdding) {
      const { error } = await supabase
        .from("terms")
        .insert([{
          ...formData,
          created_by_user_id: user.id,
          modified_by_user_id: user.id
        }]);
      if (error) alert(error.message);
      else {
        setIsAdding(false);
        fetchData();
      }
    } else if (editingTerm) {
      const { error } = await supabase
        .from("terms")
        .update({
          ...formData,
          modified_by_user_id: user.id
        })
        .eq("id", editingTerm.id);
      if (error) alert(error.message);
      else {
        setEditingTerm(null);
        fetchData();
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this term?")) return;
    const { error } = await supabase.from("terms").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Terms</h1>
          <p className={styles.dashboardSubtitle}>Glossary of terms used in humor generation.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingTerm(null); setFormData({ term: "", definition: "", example: "", priority: 0, term_type_id: termTypes[0]?.id || "" }); }}
          className={tableStyles.addButton}
        >
          + Add Term
        </button>
      </div>

      {(isAdding || editingTerm) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{isAdding ? "Add New Term" : "Edit Term"}</h2>
          <div className={tableStyles.formGrid}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div className={tableStyles.formField}>
                <label className={tableStyles.formLabel}>Term</label>
                <input 
                  type="text" 
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className={tableStyles.input}
                />
              </div>
              <div className={tableStyles.formField}>
                <label className={tableStyles.formLabel}>Type</label>
                <select 
                  value={formData.term_type_id}
                  onChange={(e) => setFormData({ ...formData, term_type_id: e.target.value })}
                  className={tableStyles.input}
                >
                  <option value="">Select Type</option>
                  {termTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className={tableStyles.formField} style={{ gridColumn: '1 / -1' }}>
                <label className={tableStyles.formLabel}>Definition</label>
                <textarea 
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  className={tableStyles.input}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div className={tableStyles.formField} style={{ gridColumn: '1 / -1' }}>
                <label className={tableStyles.formLabel}>Example</label>
                <textarea 
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  className={tableStyles.input}
                  style={{ minHeight: '60px' }}
                />
              </div>
              <div className={tableStyles.formField}>
                <label className={tableStyles.formLabel}>Priority</label>
                <input 
                  type="number" 
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className={tableStyles.input}
                />
              </div>
            </div>
            <div className={tableStyles.buttonGroup}>
              <button 
                onClick={handleSubmit}
                className={tableStyles.saveButton}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingTerm(null); }}
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
          <p>Loading terms...</p>
        ) : terms.length === 0 ? (
          <p>No terms found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>TERM</th>
                <th className={tableStyles.th}>TYPE</th>
                <th className={tableStyles.th}>PRIORITY</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => (
                <tr key={term.id}>
                  <td className={tableStyles.td}>
                    <div style={{ fontWeight: 'bold', color: '#4ade80' }}>{term.term}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{term.definition}</div>
                  </td>
                  <td className={tableStyles.td}>
                    {termTypes.find(t => t.id === term.term_type_id)?.name || term.term_type_id}
                  </td>
                  <td className={tableStyles.td}>{term.priority}</td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => { setEditingTerm(term); setFormData(term); setIsAdding(false); }}
                        className={tableStyles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(term.id)}
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
