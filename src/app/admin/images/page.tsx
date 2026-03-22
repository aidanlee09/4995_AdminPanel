"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import styles from "../../page.module.css";

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
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 21;
  
  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, [currentPage]);

  async function fetchImages() {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("images")
      .select("*", { count: "exact" })
      .order("created_datetime_utc", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      setImages(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to 'images' bucket
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      alert("Error uploading file: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      setUploading(false);
      return;
    }

    // Insert into 'images' table
    const { error: insertError } = await supabase
      .from("images")
      .insert([{ 
        url: publicUrl,
        created_by_user_id: user.id,
        modified_by_user_id: user.id
      }]);

    if (insertError) {
      alert("Error saving image record: " + insertError.message);
    } else {
      fetchImages();
    }
    setUploading(false);
  }

  async function handleAddImage() {
    if (!newUrl) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const { error } = await supabase
      .from("images")
      .insert([{ 
        url: newUrl,
        created_by_user_id: user.id,
        modified_by_user_id: user.id
      }]);

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const { error } = await supabase
      .from("images")
      .update({ 
        url: newUrl,
        modified_by_user_id: user.id
      })
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
    <div>
      <div className={styles.header} style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Images</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Upload and manage image assets for captioning.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ 
            padding: '10px 20px', 
            backgroundColor: '#111', 
            color: '#fff', 
            border: '1px solid #333', 
            borderRadius: '4px', 
            fontWeight: 'bold', 
            cursor: uploading ? 'wait' : 'pointer',
            fontSize: '14px'
          }}>
            {uploading ? "Uploading..." : "Upload File"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={uploading}
              style={{ display: 'none' }} 
            />
          </label>
          <button 
            onClick={() => { setIsAdding(true); setEditingImage(null); setNewUrl(""); }}
            style={{ padding: '10px 20px', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            + Add URL
          </button>
        </div>
      </div>

      {(isAdding || editingImage) && (
        <div className={styles.statCard} style={{ marginBottom: '20px', border: '1px solid #4ade80' }}>
          <h2>{isAdding ? "Add New Image URL" : "Edit Image URL"}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="https://example.com/image.jpg" 
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {images.map((image) => (
              <div key={image.id} style={{ border: '1px solid #222', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
                <div 
                  onClick={() => setSelectedImage(image.url)} 
                  style={{ cursor: 'zoom-in', height: '150px', overflow: 'hidden' }}
                >
                  <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                </div>
                <div style={{ padding: '12px' }}>
                  <p style={{ fontSize: '10px', color: '#555', wordBreak: 'break-all', marginBottom: '10px', height: '24px', overflow: 'hidden' }}>{image.url}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => { setEditingImage(image); setNewUrl(image.url); setIsAdding(false); }}
                      style={{ flex: 1, padding: '6px', backgroundColor: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteImage(image.id)}
                      style={{ flex: 1, padding: '6px', backgroundColor: 'transparent', border: '1px solid #333', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px', padding: '10px' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: currentPage === 1 ? '#111' : 'transparent', 
              color: currentPage === 1 ? '#444' : '#4ade80', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#888' }}>
            Page {currentPage} of {totalPages} ({totalCount} total)
          </span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: currentPage === totalPages ? '#111' : 'transparent', 
              color: currentPage === totalPages ? '#444' : '#4ade80', 
              border: '1px solid #333', 
              borderRadius: '4px', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' 
            }}
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
