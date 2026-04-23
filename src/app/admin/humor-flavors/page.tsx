"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface HumorFlavor {
  id: string;
  created_datetime_utc: string;
  description: string;
  slug: string;
}

export default function HumorFlavorsPage() {
  const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchFlavors();
  }, [currentPage]);

  async function fetchFlavors() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("humor_flavors")
      .select("*", { count: "exact" })
      .order("slug", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching humor flavors:", error);
    } else {
      setFlavors(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Humor Flavors</h1>
          <p className={styles.dashboardSubtitle}>Available humor styles and their descriptions.</p>
        </div>
      </div>

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading flavors...</p>
        ) : flavors.length === 0 ? (
          <p>No humor flavors found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>Slug</th>
                <th className={tableStyles.th}>Description</th>
                <th className={tableStyles.th}>Created (UTC)</th>
                <th className={tableStyles.th}>ID</th>
              </tr>
            </thead>
            <tbody>
              {flavors.map((flavor) => (
                <tr key={flavor.id}>
                  <td className={tableStyles.td} style={{ fontWeight: 'bold', color: '#4ade80' }}>
                    {flavor.slug.toUpperCase()}
                  </td>
                  <td className={tableStyles.td}>
                    {flavor.description}
                  </td>
                  <td className={tableStyles.td}>
                    {new Date(flavor.created_datetime_utc).toLocaleString()}
                  </td>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>
                    {flavor.id}
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
