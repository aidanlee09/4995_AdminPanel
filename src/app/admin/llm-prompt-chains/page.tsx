"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface LLMPromptChain {
  id: string;
  created_datetime_utc: string;
  caption_request_id: string;
}

export default function LLMPromptChainsPage() {
  const [chains, setChains] = useState<LLMPromptChain[]>([]);
  const [loading, setLoading] = useState(true);
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
      .from("llm_prompt_chains")
      .select("*", { count: "exact" })
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching prompt chains:", error);
    } else {
      setChains(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

interface LLMPromptChain {
...
  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>LLM Prompt Chains</h1>
          <p className={styles.dashboardSubtitle}>Execution history of multi-step prompt workflows.</p>
        </div>
      </div>

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading prompt chains...</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>ID</th>
                <th className={tableStyles.th}>CREATED (UTC)</th>
                <th className={tableStyles.th}>CAPTION REQUEST ID</th>
              </tr>
            </thead>
            <tbody>
              {chains.map((chain) => (
                <tr key={chain.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`} style={{ fontSize: '11px', fontFamily: 'monospace' }}>{chain.id}</td>
                  <td className={tableStyles.td}>
                    {new Date(chain.created_datetime_utc).toLocaleString()}
                  </td>
                  <td className={tableStyles.td} style={{ fontSize: '11px', fontFamily: 'monospace' }}>{chain.caption_request_id}</td>
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
