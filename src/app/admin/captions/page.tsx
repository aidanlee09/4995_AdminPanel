"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import Link from "next/link";

interface Caption {
  id: string;
  content: string;
  like_count: number;
  image_id: string;
  created_datetime_utc?: string;
}

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCaptions() {
      const { data, error } = await supabase
        .from("captions")
        .select("*")
        .not("content", "is", null)
        .order("created_datetime_utc", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching captions:", error);
      } else {
        setCaptions(data || []);
      }
      setLoading(false);
    }

    fetchCaptions();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Back</Link>
            <h1>Captions</h1>
          </div>
        </div>

        <div className={styles.statCard}>
          {loading ? (
            <p>Loading captions...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ padding: '12px' }}>Content</th>
                    <th style={{ padding: '12px' }}>Likes</th>
                    <th style={{ padding: '12px' }}>Image ID</th>
                    <th style={{ padding: '12px' }}>Created (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {captions.map((caption) => (
                    <tr key={caption.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{caption.content}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          color: (caption.like_count || 0) >= 0 ? '#4ade80' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {caption.like_count || 0}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
                        {caption.image_id}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#888' }}>
                        {caption.created_datetime_utc ? new Date(caption.created_datetime_utc).toLocaleString() : 'N/A'}
                      </td>
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
