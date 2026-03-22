"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>User Profiles</h1>
        {!loading && (
          <div style={{ color: '#888', fontSize: '14px', fontWeight: 700 }}>
            {totalCount} TOTAL PROFILES
          </div>
        )}
      </div>

      <div className={styles.statCard} style={{ overflowX: 'auto', minHeight: 'auto' }}>
        {loading ? (
          <p>Loading profiles...</p>
        ) : profiles.length === 0 ? (
          <p>No profiles found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                {columns.map(col => (
                  <th key={col} style={{ padding: '12px', textTransform: 'capitalize', fontSize: '12px', color: '#555' }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile, i) => (
                <tr key={profile.id || i} style={{ borderBottom: '1px solid #222' }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '12px', fontSize: '14px', color: col === 'id' ? '#fff' : '#888' }}>
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
