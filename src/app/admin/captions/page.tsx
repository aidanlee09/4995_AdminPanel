"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface Caption {
  id: string;
  content: string;
  like_count: number;
  image_id: string;
  humor_flavor_id: string;
  created_datetime_utc?: string;
}

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchCaptions();
  }, [currentPage]);

  async function fetchCaptions() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("captions")
      .select("*", { count: "exact" })
      .not("content", "is", null)
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching captions:", error);
    } else {
      setCaptions(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Captions</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Latest generated captions and their performance.</p>
      </div>

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading captions...</p>
        ) : captions.length === 0 ? (
          <p>No captions found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CONTENT</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>LIKES</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>FLAVOR</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CREATED (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {captions.map((caption) => (
                  <tr key={caption.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff', maxWidth: '400px' }}>{caption.content}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: (caption.like_count || 0) >= 0 ? '#4ade80' : '#ef4444',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>
                        {caption.like_count || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                      {caption.humor_flavor_id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
                      {caption.created_datetime_utc ? new Date(caption.created_datetime_utc).toLocaleString() : 'N/A'}
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
