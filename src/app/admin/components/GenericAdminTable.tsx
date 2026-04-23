"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "./GenericAdminTable.module.css";

interface GenericAdminTableProps {
  tableName: string;
  title: string;
  isReadOnly?: boolean;
  editableColumns?: string[];
  idColumn?: string;
  orderBy?: string;
  orderAscending?: boolean;
}

export default function GenericAdminTable({
  tableName,
  title,
  isReadOnly = false,
  editableColumns = [],
  idColumn = 'id',
  orderBy = 'created_datetime_utc',
  orderAscending = false
}: GenericAdminTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [newItem, setNewItem] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const supabase = createClient();

  useEffect(() => {
    setCurrentPage(1);
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [tableName, orderBy, orderAscending, currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  async function fetchData() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(tableName).select("*", { count: "exact" });
    
    const { data: result, error, count } = await query
      .order(orderBy, { ascending: orderAscending })
      .range(from, to);

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      // Fallback: fetch without ordering if it failed due to missing column
      const { data: resultNoOrder, error: errorNoOrder, count: countNoOrder } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .range(from, to);
      
      if (errorNoOrder) {
        console.error(`Error fetching ${tableName} (no order):`, errorNoOrder);
        setData([]);
        setTotalCount(0);
      } else {
        setData(resultNoOrder || []);
        setTotalCount(countNoOrder || 0);
        updateColumns(resultNoOrder || []);
      }
    } else {
      setData(result || []);
      setTotalCount(count || 0);
      updateColumns(result || []);
    }
    setLoading(false);
  }

  function updateColumns(fetchedData: any[]) {
    if (fetchedData.length > 0) {
      const allKeys = new Set<string>();
      fetchedData.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
      });
      const sortedKeys = Array.from(allKeys).sort((a, b) => {
        if (a === idColumn) return -1;
        if (b === idColumn) return 1;
        return a.localeCompare(b);
      });
      setColumns(sortedKeys);
    } else if (editableColumns.length > 0) {
      setColumns([idColumn, ...editableColumns]);
    } else {
      setColumns([idColumn]);
    }
  }

  async function handleAdd() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const { error } = await supabase.from(tableName).insert([{
      ...newItem,
      created_by_user_id: user.id,
      modified_by_user_id: user.id
    }]);
    if (error) {
      alert("Error adding: " + error.message);
    } else {
      setNewItem({});
      setIsAdding(false);
      fetchData();
    }
  }

  async function handleUpdate() {
    if (!editingItem) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const updateData = { ...newItem, modified_by_user_id: user.id };
    delete updateData[idColumn];

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq(idColumn, editingItem[idColumn]);

    if (error) {
      alert("Error updating: " + error.message);
    } else {
      setEditingItem(null);
      setNewItem({});
      fetchData();
    }
  }

  async function handleDelete(id: any) {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, id);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      fetchData();
    }
  }

  const handleInputChange = (col: string, value: any) => {
    setNewItem({ ...newItem, [col]: value });
  };

  return (
    <div style={{ width: '100%' }}>
      <div className={tableStyles.tableHeader}>
        <h1 className={tableStyles.title}>{title}</h1>
        {!isReadOnly && (
          <button 
            onClick={() => { setIsAdding(true); setEditingItem(null); setNewItem({}); }}
            className={tableStyles.addButton}
          >
            + Add New
          </button>
        )}
      </div>

      {(isAdding || editingItem) && !isReadOnly && (
        <div className={styles.statCard} style={{ marginBottom: '30px' }}>
          <h2>{isAdding ? `Add to ${title}` : `Edit ${title}`}</h2>
          <div className={tableStyles.formGrid}>
            {editableColumns.map(col => (
              <div key={col} className={tableStyles.formField}>
                <label className={tableStyles.formLabel}>{col.replace(/_/g, ' ')}</label>
                <input 
                  type="text" 
                  value={newItem[col] || ''}
                  onChange={(e) => handleInputChange(col, e.target.value)}
                  className={tableStyles.input}
                />
              </div>
            ))}
            <div className={tableStyles.buttonGroup}>
              <button 
                onClick={isAdding ? handleAdd : handleUpdate}
                className={tableStyles.saveButton}
              >
                {isAdding ? "Save" : "Update"}
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingItem(null); setNewItem({}); }}
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
          <p>Loading {title.toLowerCase()}...</p>
        ) : data.length === 0 ? (
          <p>No data found in {tableName}.</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} className={tableStyles.th}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                {!isReadOnly && <th className={tableStyles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item[idColumn] || i}>
                  {columns.map(col => (
                    <td key={col} className={`${tableStyles.td} ${col === idColumn ? tableStyles.idTd : ''}`}>
                      {typeof item[col] === 'boolean' ? (
                        item[col] ? (
                          <span style={{ color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>TRUE</span>
                        ) : (
                          <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>FALSE</span>
                        )
                      ) : (
                        String(item[col] ?? 'N/A')
                      )}
                    </td>
                  ))}
                  {!isReadOnly && (
                    <td className={tableStyles.actionTd}>
                      <div className={tableStyles.actionButtons}>
                        <button 
                          onClick={() => { setEditingItem(item); setNewItem(item); setIsAdding(false); }}
                          className={tableStyles.editButton}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item[idColumn])}
                          className={tableStyles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
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
