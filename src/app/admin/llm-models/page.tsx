"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import tableStyles from "../components/GenericAdminTable.module.css";

interface LLMModel {
  id: string;
  name: string;
  llm_provider_id: string;
  provider_model_id: string;
  is_temperature_supported: boolean;
  created_datetime_utc?: string;
}

interface LLMProvider {
  id: string;
  name: string;
}

export default function LLMModelsPage() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<LLMModel>>({
    name: "",
    llm_provider_id: "",
    provider_model_id: "",
    is_temperature_supported: true
  });
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

    const { data: providerData } = await supabase.from("llm_providers").select("id, name");
    setProviders(providerData || []);

    const { data, error, count } = await supabase
      .from("llm_models")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching models:", error);
    } else {
      setModels(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleSubmit() {
    if (!formData.name || !formData.llm_provider_id || !formData.provider_model_id) {
      alert("Name, Provider, and Provider Model ID are required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    if (isAdding) {
      const { error } = await supabase.from("llm_models").insert([{
        ...formData,
        created_by_user_id: user.id,
        modified_by_user_id: user.id
      }]);
      if (error) alert(error.message);
      else { setIsAdding(false); fetchData(); }
    } else if (editingModel) {
      const { error } = await supabase.from("llm_models").update({
        ...formData,
        modified_by_user_id: user.id
      }).eq("id", editingModel.id);
      if (error) alert(error.message);
      else { setEditingModel(null); fetchData(); }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete model?")) return;
    const { error } = await supabase.from("llm_models").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchData();
  }

  return (
    <div style={{ width: '100%' }}>
      <div className={styles.dashboardHeader}>
        <div className={styles.header}>
          <h1 className={styles.dashboardTitle}>LLM Models</h1>
          <p className={styles.dashboardSubtitle}>Configure specific AI models and their capabilities.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingModel(null); setFormData({ name: "", llm_provider_id: providers[0]?.id || "", provider_model_id: "", is_temperature_supported: true }); }}
          className={tableStyles.addButton}
        >
          + Add Model
        </button>
      </div>

      {(isAdding || editingModel) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>{isAdding ? "Add New Model" : "Edit Model"}</h2>
          <div className={tableStyles.formGrid}>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Display Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={tableStyles.input}
              />
            </div>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Provider</label>
              <select 
                value={formData.llm_provider_id}
                onChange={(e) => setFormData({ ...formData, llm_provider_id: e.target.value })}
                className={tableStyles.input}
              >
                <option value="">Select Provider</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={tableStyles.formField}>
              <label className={tableStyles.formLabel}>Provider Model ID (e.g., gpt-4o)</label>
              <input 
                type="text" 
                value={formData.provider_model_id}
                onChange={(e) => setFormData({ ...formData, provider_model_id: e.target.value })}
                className={tableStyles.input}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input 
                type="checkbox" 
                checked={formData.is_temperature_supported}
                onChange={(e) => setFormData({ ...formData, is_temperature_supported: e.target.checked })}
                id="temp-support"
              />
              <label htmlFor="temp-support" style={{ fontSize: '14px', color: '#fff' }}>Temperature Supported</label>
            </div>
            <div className={tableStyles.buttonGroup}>
              <button 
                onClick={handleSubmit}
                className={tableStyles.saveButton}
              >
                Save
              </button>
              <button 
                onClick={() => { setIsAdding(false); setEditingModel(null); }}
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
          <p>Loading models...</p>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th className={tableStyles.th}>NAME</th>
                <th className={tableStyles.th}>PROVIDER</th>
                <th className={tableStyles.th}>MODEL ID</th>
                <th className={tableStyles.th}>TEMP</th>
                <th className={tableStyles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td className={`${tableStyles.td} ${tableStyles.idTd}`} style={{ fontWeight: 'bold' }}>{model.name}</td>
                  <td className={tableStyles.td}>
                    {providers.find(p => p.id === model.llm_provider_id)?.name || model.llm_provider_id}
                  </td>
                  <td className={tableStyles.td} style={{ fontFamily: 'monospace' }}>{model.provider_model_id}</td>
                  <td className={tableStyles.td}>
                    {model.is_temperature_supported ? 
                      <span style={{ color: '#4ade80', fontSize: '11px' }}>YES</span> : 
                      <span style={{ color: '#f87171', fontSize: '11px' }}>NO</span>
                    }
                  </td>
                  <td className={tableStyles.actionTd}>
                    <div className={tableStyles.actionButtons}>
                      <button 
                        onClick={() => { setEditingModel(model); setFormData(model); setIsAdding(false); }}
                        className={tableStyles.editButton}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(model.id)}
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
