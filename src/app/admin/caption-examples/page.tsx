"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface CaptionExample {
  id: string;
  image_description: string;
  caption: string;
  explanation: string;
  priority: number;
  image_id: string;
  created_datetime_utc?: string;
}

export default function CaptionExamplesPage() {
  const [examples, setExamples] = useState<CaptionExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExample, setEditingExample] = useState<CaptionExample | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<CaptionExample>>({
    image_description: "",
    caption: "",
    explanation: "",
    priority: 0,
    image_id: ""
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

    const { data, error, count } = await supabase
      .from("caption_examples")
      .select("*", { count: "exact" })
      .order("priority", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching caption examples:", error);
    } else {
      setExamples(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleSubmit() {
    if (!formData.caption || !formData.image_description) {
      alert("Caption and Description are required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    if (isAdding) {
      const { error } = await supabase
        .from("caption_examples")
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
    } else if (editingExample) {
      const { error } = await supabase
        .from("caption_examples")
        .update({
          ...formData,
          modified_by_user_id: user.id
        })
        .eq("id", editingExample.id);
      if (error) alert(error.message);
      else {
        setEditingExample(null);
        fetchData();
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this example?")) return;
    const { error } = await supabase.from("caption_examples").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Caption Examples</h1>
          <p className={styles.dashboardSubtitle}>Reference examples for the humor generation system.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingExample(null); setFormData({ image_description: "", caption: "", explanation: "", priority: 0, image_id: "" }); }}
          style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}
        >
          + Add Example
        </button>
      </div>

      {(isAdding || editingExample) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80', minHeight: 'auto' }}>
          <h2>{isAdding ? "Add New Example" : "Edit Example"}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Image Description</label>
              <textarea 
                value={formData.image_description}
                onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Caption</label>
              <textarea 
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Explanation</label>
              <textarea 
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#888' }}>Priority</label>
                <input 
                  type="number" 
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#888' }}>Image ID (Optional)</label>
                <input 
                  type="text" 
                  value={formData.image_id}
                  onChange={(e) => setFormData({ ...formData, image_id: e.target.value })}
                  style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                />
              </div>
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
              onClick={() => { setIsAdding(false); setEditingExample(null); }}
              style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading examples...</p>
        ) : examples.length === 0 ? (
          <p>No examples found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>EXAMPLE</th>
                <th className={tableStyles.th}>PRIORITY</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((example) => (
                <tr key={example.id}>
                  <td className={tableStyles.td}>
                    <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '4px' }}>{example.caption}</div>
                    <div style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>Desc: {example.image_description}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>Exp: {example.explanation}</div>
                  </td>
                  <td className={tableStyles.td} style={{ fontSize: '14px' }}>{example.priority}</td>
                  <td className={tableStyles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => { setEditingExample(example); setFormData(example); setIsAdding(false); }}
                        style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(example.id)}
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
