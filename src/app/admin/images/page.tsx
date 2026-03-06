"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";
import Link from "next/link";

interface Image {
  id: string;
  url: string;
  created_datetime_utc?: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<Image | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_datetime_utc", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      setImages(data || []);
    }
    setLoading(false);
  }

  async function handleAddImage() {
    if (!newUrl) return;
    const { error } = await supabase
      .from("images")
      .insert([{ url: newUrl }]);

    if (error) {
      alert("Error adding image: " + error.message);
    } else {
      setNewUrl("");
      setIsAdding(false);
      fetchImages();
    }
  }

  async function handleUpdateImage() {
    if (!editingImage || !newUrl) return;
    const { error } = await supabase
      .from("images")
      .update({ url: newUrl })
      .eq("id", editingImage.id);

    if (error) {
      alert("Error updating image: " + error.message);
    } else {
      setEditingImage(null);
      setNewUrl("");
      fetchImages();
    }
  }

  async function handleDeleteImage(id: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;
    const { error } = await supabase
      .from("images")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting image: " + error.message);
    } else {
      fetchImages();
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>← Back</Link>
              <h1>Manage Images</h1>
            </div>
            <button 
              onClick={() => { setIsAdding(true); setEditingImage(null); setNewUrl(""); }}
              style={{ padding: '8px 16px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Add Image
            </button>
          </div>
        </div>

        {(isAdding || editingImage) && (
          <div className={styles.statCard} style={{ marginBottom: '20px' }}>
            <h2>{isAdding ? "Add New Image" : "Edit Image"}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <input 
                type="text" 
                placeholder="Image URL" 
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={isAdding ? handleAddImage : handleUpdateImage}
                  style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isAdding ? "Save" : "Update"}
                </button>
                <button 
                  onClick={() => { setIsAdding(false); setEditingImage(null); setNewUrl(""); }}
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
            <p>Loading images...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {images.map((image) => (
                <div key={image.id} style={{ border: '1px solid #222', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
                  <div 
                    onClick={() => setSelectedImage(image.url)} 
                    style={{ cursor: 'zoom-in', height: '150px', overflow: 'hidden' }}
                  >
                    <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontSize: '10px', color: '#555', wordBreak: 'break-all', marginBottom: '10px' }}>{image.url}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => { setEditingImage(image); setNewUrl(image.url); setIsAdding(false); }}
                        style={{ flex: 1, padding: '6px', backgroundColor: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteImage(image.id)}
                        style={{ flex: 1, padding: '6px', backgroundColor: 'transparent', border: '1px solid #333', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '40px',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
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
