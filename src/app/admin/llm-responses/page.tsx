"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

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
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>LLM Responses</h1>
          <p className={styles.dashboardSubtitle}>Raw output and metadata from model executions.</p>
        </div>
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
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#111', 
              padding: '20px', 
              borderRadius: '8px', 
              maxWidth: '900px', 
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #333'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Response Details</h2>
              <button onClick={() => setSelectedResponse(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
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

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading responses...</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>DATE</th>
                <th className={tableStyles.th}>MODEL</th>
                <th className={tableStyles.th}>TEMP</th>
                <th className={tableStyles.th}>TIME</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((res) => (
                <tr key={res.id}>
                  <td className={tableStyles.td}>
                    {new Date(res.created_datetime_utc).toLocaleString()}
                  </td>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>{res.llm_model_id}</td>
                  <td className={tableStyles.td}>{res.llm_temperature}</td>
                  <td className={tableStyles.td}>{res.processing_time_seconds}s</td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => setSelectedResponse(res)}
                        className={tableStyles.editButton}
                      >
                        View Details
                      </button>
                    </div>
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
