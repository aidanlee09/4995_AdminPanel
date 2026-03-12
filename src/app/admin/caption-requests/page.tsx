"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface CaptionRequest {
  id: string;
  created_datetime_utc: string;
  profile_id: string;
  image_id: string;
}

export default function CaptionRequestsPage() {
  const [requests, setRequests] = useState<CaptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from("caption_requests")
        .select("*")
        .order("created_datetime_utc", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching requests:", error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    }

    fetchRequests();
  }, []);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Caption Requests</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Pending and historical requests for image captioning.</p>
      </div>

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ID</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CREATED (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>USER ID</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>IMAGE ID</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>{req.id}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#fff' }}>
                      {new Date(req.created_datetime_utc).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{req.profile_id}</td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{req.image_id}</td>
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
