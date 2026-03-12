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
    </div>
  );
}
