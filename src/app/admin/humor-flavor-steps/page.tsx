"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
  const supabase = createClient();

  useEffect(() => {
    async function fetchSteps() {
      setLoading(true);
      const { data, error } = await supabase
        .from("humor_flavor_steps")
        .select("*")
        .order("humor_flavor_id", { ascending: true })
        .order("order_by", { ascending: true });

      if (error) {
        console.error("Error fetching flavor steps:", error);
      } else {
        setSteps(data || []);
      }
      setLoading(false);
    }

    fetchSteps();
  }, []);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Humor Flavor Steps</h1>
        <p style={{ color: '#888', marginTop: '4px' }}>Logical steps for the humor generation process.</p>
      </div>

      <div className={styles.statCard}>
        {loading ? (
          <p>Loading flavor steps...</p>
        ) : steps.length === 0 ? (
          <p>No flavor steps found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Order</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Temp</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Flavor ID</th>
                  <th style={{ padding: '12px', color: '#888', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>System Prompt</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4ade80' }}>
                      {step.order_by}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff' }}>
                      {step.description}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#fff' }}>
                      {step.llm_temperature}
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: '#444', fontFamily: 'monospace' }}>
                      {step.humor_flavor_id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#888', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {step.llm_system_prompt}
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
