"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface LLMPromptChain {
  id: string;
  created_datetime_utc: string;
  caption_request_id: string;
}

export default function LLMPromptChainsPage() {
  const [chains, setChains] = useState<LLMPromptChain[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("llm_prompt_chains")
        .select("*")
        .order("created_datetime_utc", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching prompt chains:", error);
      } else {
        setChains(data || []);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>LLM Prompt Chains</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Execution history of multi-step prompt workflows.</p>
      </div>

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading prompt chains...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ID</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CREATED (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CAPTION REQUEST ID</th>
                </tr>
              </thead>
              <tbody>
                {chains.map((chain) => (
                  <tr key={chain.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>{chain.id}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#fff' }}>
                      {new Date(chain.created_datetime_utc).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{chain.caption_request_id}</td>
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
