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
  const supabase = createClient();

  useEffect(() => {
    async function fetchFlavors() {
      setLoading(true);
      const { data, error } = await supabase
        .from("humor_flavors")
        .select("*")
        .order("slug", { ascending: true });

      if (error) {
        console.error("Error fetching humor flavors:", error);
      } else {
        setFlavors(data || []);
      }
      setLoading(false);
    }

    fetchFlavors();
  }, []);

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
    </div>
  );
}
