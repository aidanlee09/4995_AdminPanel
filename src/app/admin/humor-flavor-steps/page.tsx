"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface HumorFlavorStep {
  id: string;
  created_datetime_utc: string;
  humor_flavor_id: string;
  llm_temperature: number;
  order_by: number;
  llm_input_type_id: string;
  llm_output_type_id: string;
  llm_model_id: string;
  humor_flavor_step_type_id: string;
  llm_system_prompt: string;
  llm_user_prompt: string;
  description: string;
}

export default function HumorFlavorStepsPage() {
  const [steps, setSteps] = useState<HumorFlavorStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchSteps();
  }, [currentPage]);

  async function fetchSteps() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("humor_flavor_steps")
      .select("*", { count: "exact" })
      .order("humor_flavor_id", { ascending: true })
      .order("order_by", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching flavor steps:", error);
    } else {
      setSteps(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Humor Flavor Steps</h1>
          <p className={styles.dashboardSubtitle}>Logical steps for the humor generation process.</p>
        </div>
      </div>

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading flavor steps...</p>
        ) : steps.length === 0 ? (
          <p>No flavor steps found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Order</th>
                <th className={tableStyles.th}>Description</th>
                <th className={tableStyles.th}>Temp</th>
                <th className={tableStyles.th}>Flavor ID</th>
                <th className={tableStyles.th}>System Prompt</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.id}>
                  <td className={tableStyles.td} style={{ fontWeight: 'bold', color: '#4ade80' }}>
                    {step.order_by}
                  </td>
                  <td className={tableStyles.td}>
                    {step.description}
                  </td>
                  <td className={tableStyles.td}>
                    {step.llm_temperature}
                  </td>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>
                    {step.humor_flavor_id}
                  </td>
                  <td className={tableStyles.td} style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {step.llm_system_prompt}
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
