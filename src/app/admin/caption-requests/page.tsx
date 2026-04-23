"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface CaptionRequest {
  id: string;
  created_datetime_utc: string;
  profile_id: string;
  image_id: string;
  images: {
    url: string;
  } | null;
}

export default function CaptionRequestsPage() {
  const [requests, setRequests] = useState<CaptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  async function fetchRequests() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("caption_requests")
      .select(`
        *,
        images (
          url
        )
      `, { count: "exact" })
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data as any || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Caption Requests</h1>
          <p className={styles.dashboardSubtitle}>Pending and historical requests for image captioning.</p>
        </div>
      </div>

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>ID</th>
                <th className={tableStyles.th}>CREATED (UTC)</th>
                <th className={tableStyles.th}>USER ID</th>
                <th className={tableStyles.th}>IMAGE ID</th>
                <th className={tableStyles.th}>IMAGE</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>{req.id}</td>
                  <td className={tableStyles.td}>
                    {new Date(req.created_datetime_utc).toLocaleString()}
                  </td>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>{req.profile_id}</td>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`}>{req.image_id}</td>
                  <td className={tableStyles.td}>
                    {req.images?.url ? (
                      <div 
                        onClick={() => setSelectedImage(req.images!.url)}
                        style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid #333' }}
                      >
                        <img src={req.images.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '50px', height: '50px', borderRadius: '4px', backgroundColor: '#111', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#444' }}>
                        N/A
                      </div>
                    )}
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

      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
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
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={selectedImage} 
            alt="Zoomed view" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 0 40px rgba(0,0,0,0.5)'
            }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
