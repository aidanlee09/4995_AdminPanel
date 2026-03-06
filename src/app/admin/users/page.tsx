"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import Link from "next/link";

export default function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("is_superadmin", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
      } else if (data && data.length > 0) {
        setProfiles(data);
        
        // Robust column detection: check every row to ensure no columns are missed
        const allKeys = new Set<string>();
        data.forEach(row => {
          Object.keys(row).forEach(key => allKeys.add(key));
        });
        // Sort keys to keep ID first, then superadmin, then others
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
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Back</Link>
              <h1>User Profiles</h1>
            </div>
            {!loading && (
              <div style={{ color: '#888', fontSize: '14px', fontWeight: 700 }}>
                {profiles.length} TOTAL PROFILES
              </div>
            )}
          </div>
        </div>

        <div className={styles.statCard}>
          {loading ? (
            <p>Loading profiles...</p>
          ) : profiles.length === 0 ? (
            <p>No profiles found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    {columns.map(col => (
                      <th key={col} style={{ padding: '12px', textTransform: 'capitalize' }}>
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
