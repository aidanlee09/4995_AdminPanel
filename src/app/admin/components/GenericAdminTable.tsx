"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [tableName, orderBy, orderAscending]);

  async function fetchData() {
    setLoading(true);
    let query = supabase.from(tableName).select("*");
    
    // Check if the order column exists before ordering
    // We'll just try to order and if it fails, we'll try without ordering
    const { data: result, error } = await query.order(orderBy, { ascending: orderAscending });

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      // Fallback: fetch without ordering
      const { data: resultNoOrder, error: errorNoOrder } = await supabase.from(tableName).select("*");
      if (errorNoOrder) {
        console.error(`Error fetching ${tableName} (no order):`, errorNoOrder);
        setData([]);
      } else {
        setData(resultNoOrder || []);
        updateColumns(resultNoOrder || []);
      }
    } else {
      setData(result || []);
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
    const { error } = await supabase.from(tableName).insert([newItem]);
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
    const updateData = { ...newItem };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{title}</h1>
        {!isReadOnly && (
          <button 
            onClick={() => { setIsAdding(true); setEditingItem(null); setNewItem({}); }}
            style={{ padding: '8px 16px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Add New
          </button>
        )}
      </div>

      {(isAdding || editingItem) && !isReadOnly && (
        <div className={styles.statCard} style={{ marginBottom: '30px' }}>
          <h2>{isAdding ? `Add to ${title}` : `Edit ${title}`}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            {editableColumns.map(col => (
              <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>{col.replace(/_/g, ' ')}</label>
                <input 
                  type="text" 
                  value={newItem[col] || ''}
                  onChange={(e) => handleInputChange(col, e.target.value)}
                  style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={isAdding ? handleAdd : handleUpdate}
                style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isAdding ? "Save" : "Update"}
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingItem(null); setNewItem({}); }}
                style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statCard} style={{ overflowX: 'auto', minHeight: 'auto' }}>
        {loading ? (
          <p>Loading {title.toLowerCase()}...</p>
        ) : data.length === 0 ? (
          <p>No data found in {tableName}.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                {columns.map(col => (
                  <th key={col} style={{ padding: '12px', textTransform: 'capitalize', fontSize: '12px', color: '#555' }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                {!isReadOnly && <th style={{ padding: '12px', textTransform: 'capitalize', fontSize: '12px', color: '#555' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item[idColumn] || i} style={{ borderBottom: '1px solid #222' }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '12px', fontSize: '14px', color: col === idColumn ? '#fff' : '#888', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => { setEditingItem(item); setNewItem(item); setIsAdding(false); }}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item[idColumn])}
                          style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
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
    </div>
  );
}
