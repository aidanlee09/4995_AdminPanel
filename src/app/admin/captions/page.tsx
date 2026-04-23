"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

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
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Captions</h1>
          <p className={styles.dashboardSubtitle}>Latest generated captions and their performance.</p>
        </div>
      </div>

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading captions...</p>
        ) : captions.length === 0 ? (
          <p>No captions found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>CONTENT</th>
                <th className={tableStyles.th}>LIKES</th>
                <th className={tableStyles.th}>FLAVOR</th>
                <th className={tableStyles.th}>CREATED (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {captions.map((caption) => (
                <tr key={caption.id}>
                  <td className={tableStyles.td} style={{ maxWidth: '400px' }}>{caption.content}</td>
                  <td className={tableStyles.td}>
                    <span style={{ 
                      color: (caption.like_count || 0) >= 0 ? '#4ade80' : '#ef4444',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {caption.like_count || 0}
                    </span>
                  </td>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>
                    {caption.humor_flavor_id}
                  </td>
                  <td className={tableStyles.td}>
                    {caption.created_datetime_utc ? new Date(caption.created_datetime_utc).toLocaleString() : 'N/A'}
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
