"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

export default function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("is_superadmin", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching profiles:", error);
      } else if (data && data.length > 0) {
        setProfiles(data);
        setTotalCount(count || 0);
        
        // Robust column detection
        const allKeys = new Set<string>();
        data.forEach(row => {
          Object.keys(row).forEach(key => allKeys.add(key));
        });
        const sortedKeys = Array.from(allKeys).sort((a, b) => {
          if (a === 'id') return -1;
          if (b === 'id') return 1;
          if (a === 'is_superadmin') return -1;
          if (b === 'is_superadmin') return 1;
          return a.localeCompare(b);
        });
        setColumns(sortedKeys);
      } else {
        setProfiles([]);
        setTotalCount(0);
      }
      setLoading(false);
    }

    fetchData();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>User Profiles</h1>
        </div>
        {!loading && (
          <div style={{ color: '#888', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {totalCount} TOTAL PROFILES
          </div>
        )}
      </div>

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading profiles...</p>
        ) : profiles.length === 0 ? (
          <p>No profiles found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} className={tableStyles.th}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile, i) => (
                <tr key={profile.id || i}>
                  {columns.map(col => (
                    <td key={col} className={`${tableStyles.td} ${col === 'id' ? tableStyles.idTd : ''}`}>
                      {typeof profile[col] === 'boolean' ? (
                        profile[col] ? (
                          <span style={{ color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>TRUE</span>
                        ) : (
                          <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>FALSE</span>
                        )
                      ) : (
                        String(profile[col] ?? 'N/A')
                      )}
                    </td>
                  ))}
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
