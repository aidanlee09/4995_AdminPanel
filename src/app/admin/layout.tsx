"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./admin-layout.module.css";

const menuItems = [
  { name: "Users", path: "/admin/users" },
  { name: "Images", path: "/admin/images" },
  { name: "Humor Flavors", path: "/admin/humor-flavors" },
  { name: "Humor Flavor Steps", path: "/admin/humor-flavor-steps" },
  { name: "Humor Mix", path: "/admin/humor-mix" },
  { name: "Terms", path: "/admin/terms" },
  { name: "Captions", path: "/admin/captions" },
  { name: "Caption Requests", path: "/admin/caption-requests" },
  { name: "Caption Examples", path: "/admin/caption-examples" },
  { name: "LLM Models", path: "/admin/llm-models" },
  { name: "LLM Providers", path: "/admin/llm-providers" },
  { name: "LLM Prompt Chains", path: "/admin/llm-prompt-chains" },
  { name: "LLM Responses", path: "/admin/llm-responses" },
  { name: "Signup Domains", path: "/admin/signup-domains" },
  { name: "Whitelisted Emails", path: "/admin/whitelisted-emails" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className={styles.container}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.logo}>ADMIN PANEL</Link>
        <button 
          className={styles.hamburger}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Overlay */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayVisible : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <Link href="/" className={styles.logo}>
          ADMIN PANEL
        </Link>
        
        <Link href="/" className={styles.backButton}>
          ← Back to Dashboard
        </Link>

        <div className={styles.divider} />

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : styles.inactiveNavLink}`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
