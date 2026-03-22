"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
    <div>
      <div className={styles.header} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Terms</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Glossary of terms used in humor generation.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingTerm(null); setFormData({ term: "", definition: "", example: "", priority: 0, term_type_id: termTypes[0]?.id || "" }); }}
          style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Term
        </button>
      </div>

      {(isAdding || editingTerm) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2>{isAdding ? "Add New Term" : "Edit Term"}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Term</label>
              <input 
                type="text" 
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Type</label>
              <select 
                value={formData.term_type_id}
                onChange={(e) => setFormData({ ...formData, term_type_id: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              >
                <option value="">Select Type</option>
                {termTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Definition</label>
              <textarea 
                value={formData.definition}
                onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Example</label>
              <textarea 
                value={formData.example}
                onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Priority</label>
              <input 
                type="number" 
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={handleSubmit}
              style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Save
            </button>
            <button 
              onClick={() => { setIsAdding(false); setEditingTerm(null); }}
              style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading terms...</p>
        ) : terms.length === 0 ? (
          <p>No terms found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>TERM</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>TYPE</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>PRIORITY</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#4ade80' }}>{term.term}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{term.definition}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {termTypes.find(t => t.id === term.term_type_id)?.name || term.term_type_id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{term.priority}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => { setEditingTerm(term); setFormData(term); setIsAdding(false); }}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(term.id)}
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', padding: '10px' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: currentPage === 1 ? '#111' : 'transparent', 
              color: currentPage === 1 ? '#444' : '#4ade80', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#888' }}>
            Page {currentPage} of {totalPages} ({totalCount} total)
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: currentPage === totalPages ? '#111' : 'transparent', 
              color: currentPage === totalPages ? '#444' : '#4ade80', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' 
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
