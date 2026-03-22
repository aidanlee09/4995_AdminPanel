"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface HumorFlavor {
  id: string;
  created_datetime_utc: string;
  description: string;
  slug: string;
}

export default function HumorFlavorsPage() {
  const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchFlavors();
  }, [currentPage]);

  async function fetchFlavors() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("humor_flavors")
      .select("*", { count: "exact" })
      .order("slug", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching humor flavors:", error);
    } else {
      setFlavors(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Humor Flavors</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Available humor styles and their descriptions.</p>
      </div>

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading flavors...</p>
        ) : flavors.length === 0 ? (
          <p>No humor flavors found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Slug</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Created (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {flavors.map((flavor) => (
                  <tr key={flavor.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4ade80' }}>
                      {flavor.slug.toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff' }}>
                      {flavor.description}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
                      {new Date(flavor.created_datetime_utc).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>
                      {flavor.id}
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
