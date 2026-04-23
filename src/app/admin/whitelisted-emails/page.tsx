"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface WhitelistedEmail {
  id: string;
  email_address: string;
  created_datetime_utc: string;
  modified_datetime_utc: string;
}

export default function WhitelistedEmailsPage() {
  const [emails, setEmails] = useState<WhitelistedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEmail, setEditingEmail] = useState<WhitelistedEmail | null>(null);
  const [newEmail, setNewEmail] = useState("");
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
      .from("whitelist_email_addresses")
      .select("*", { count: "exact" })
      .order("email_address", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching whitelist_email_addresses:", error);
    } else {
      setEmails(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleSubmit() {
    if (!newEmail) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    if (isAdding) {
      const { error } = await supabase.from("whitelist_email_addresses").insert([{ 
        email_address: newEmail,
        created_by_user_id: user.id,
        modified_by_user_id: user.id
      }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingEmail) {
      const { error } = await supabase.from("whitelist_email_addresses").update({ 
        email_address: newEmail,
        modified_by_user_id: user.id
      }).eq("id", editingEmail.id);
      if (error) alert(error.message);
      else { setEditingEmail(null); fetchData(); }
    }
    setNewEmail("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete whitelisted email?")) return;
    const { error } = await supabase.from("whitelist_email_addresses").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>Whitelisted Emails</h1>
          <p className={styles.dashboardSubtitle}>Specific users allowed to sign up regardless of domain.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingEmail(null); setNewEmail(""); }}
          className={tableStyles.addButton}
        >
          + Add Email
        </button>
      </div>

      {(isAdding || editingEmail) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{isAdding ? "Add New Email" : "Edit Email"}</h2>
          <div className={tableStyles.formGrid}>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Email Address</label>
              <input 
                type="email" 
                placeholder="e.g. user@example.com" 
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={tableStyles.input}
              />
            </div>
            <div className={tableStyles.buttonGroup}>
              <button 
                onClick={handleSubmit}
                className={tableStyles.saveButton}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingEmail(null); }}
                className={tableStyles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.statCard} ${tableStyles.tableContainer}`} style={{ minHeight: 'auto' }}>
        {loading ? (
          <p>Loading emails...</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>EMAIL</th>
                <th className={tableStyles.th}>CREATED (UTC)</th>
                <th className={tableStyles.th}>MODIFIED (UTC)</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`} style={{ fontWeight: 'bold' }}>{email.email_address}</td>
                  <td className={tableStyles.td}>
                    {email.created_datetime_utc ? new Date(email.created_datetime_utc).toLocaleString() : 'N/A'}
                  </td>
                  <td className={tableStyles.td}>
                    {email.modified_datetime_utc ? new Date(email.modified_datetime_utc).toLocaleString() : 'N/A'}
                  </td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => { setEditingEmail(email); setNewEmail(email.email_address); setIsAdding(false); }}
                        className={tableStyles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(email.id)}
                        className={tableStyles.deleteButton}
                      >
                        Delete
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
