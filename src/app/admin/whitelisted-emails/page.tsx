"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
  
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("whitelist_email_addresses")
      .select("*")
      .order("email_address", { ascending: true });

    if (error) {
      console.error("Error fetching whitelist_email_addresses:", error);
    } else {
      setEmails(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newEmail) return;

    if (isAdding) {
      const { error } = await supabase.from("whitelist_email_addresses").insert([{ email_address: newEmail }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingEmail) {
      const { error } = await supabase.from("whitelist_email_addresses").update({ email_address: newEmail }).eq("id", editingEmail.id);
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
    <div>
      <div className={styles.header} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Whitelisted Emails</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Specific users allowed to sign up regardless of domain.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingEmail(null); setNewEmail(""); }}
          style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Email
        </button>
      </div>

      {(isAdding || editingEmail) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2>{isAdding ? "Add New Email" : "Edit Email"}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <input 
              type="email" 
              placeholder="e.g. user@example.com" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSubmit}
                style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingEmail(null); }}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading emails...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>EMAIL</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>CREATED (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>MODIFIED (UTC)</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{email.email_address}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
                      {email.created_datetime_utc ? new Date(email.created_datetime_utc).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
                      {email.modified_datetime_utc ? new Date(email.modified_datetime_utc).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => { setEditingEmail(email); setNewEmail(email.email_address); setIsAdding(false); }}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#4ade80', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(email.id)}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Delete
                        </button>
                      </div>
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
