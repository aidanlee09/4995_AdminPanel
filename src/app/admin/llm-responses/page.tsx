"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

interface LLMResponse {
  id: string;
  created_datetime_utc: string;
  llm_model_response: string;
  processing_time_seconds: number;
  llm_model_id: string;
  profile_id: string;
  caption_request_id: string;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_temperature: number;
  humor_flavor_id: string;
  llm_prompt_chain_id: string;
  humor_flavor_step_id: string;
}

export default function LLMResponsesPage() {
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<LLMResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  async function fetchData() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("llm_model_responses")
      .select("*", { count: "exact" })
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching llm responses:", error);
    } else {
      setResponses(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>LLM Responses</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Raw output and metadata from model executions.</p>
      </div>

      {selectedResponse && (
        <div 
          onClick={() => setSelectedResponse(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '40px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#111', 
              padding: '30px', 
              borderRadius: '8px', 
              maxWidth: '900px', 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #333'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Response Details</h2>
              <button onClick={() => setSelectedResponse(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <span style={{ fontWeight: 'bold' }}>MODEL:</span> {selectedResponse.llm_model_id}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <span style={{ fontWeight: 'bold' }}>USER:</span> {selectedResponse.profile_id}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <span style={{ fontWeight: 'bold' }}>TEMP:</span> {selectedResponse.llm_temperature}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <span style={{ fontWeight: 'bold' }}>FLAVOR:</span> {selectedResponse.humor_flavor_id}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <span style={{ fontWeight: 'bold' }}>CHAIN:</span> {selectedResponse.llm_prompt_chain_id}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <span style={{ fontWeight: 'bold' }}>STEP:</span> {selectedResponse.humor_flavor_step_id}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>System Prompt</label>
                <pre style={{ backgroundColor: '#050505', padding: '10px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap', border: '1px solid #222' }}>
                  {selectedResponse.llm_system_prompt}
                </pre>
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>User Prompt</label>
                <pre style={{ backgroundColor: '#050505', padding: '10px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap', border: '1px solid #222' }}>
                  {selectedResponse.llm_user_prompt}
                </pre>
              </div>
              <div>
                <label style={{ color: '#4ade80', fontSize: '12px', textTransform: 'uppercase' }}>Model Response</label>
                <pre style={{ backgroundColor: '#050505', padding: '10px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap', border: '1px solid #4ade8022', borderLeft: '3px solid #4ade80' }}>
                  {selectedResponse.llm_model_response}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading responses...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>DATE</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>MODEL</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>TEMP</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>TIME</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((res) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#fff' }}>
                      {new Date(res.created_datetime_utc).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>{res.llm_model_id}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#fff' }}>{res.llm_temperature}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#fff' }}>{res.processing_time_seconds}s</td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => setSelectedResponse(res)}
                        style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        View Details
                      </button>
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
