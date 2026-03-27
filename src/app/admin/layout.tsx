"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../page.module.css";

const menuItems = [
  { name: "Dashboard", path: "/" },
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '250px', 
        borderRight: '1px solid #222', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        <Link 
          href="/" 
          style={{ 
            marginBottom: '20px', 
            fontWeight: 'bold', 
            fontSize: '18px', 
            letterSpacing: '0.1em', 
            textDecoration: 'none', 
            color: '#fff',
            display: 'block'
          }}
        >
          ADMIN PANEL
        </Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                textDecoration: 'none',
                color: pathname === item.path ? '#fff' : '#888',
                backgroundColor: pathname === item.path ? '#111' : 'transparent',
                fontSize: '13px',
                fontWeight: pathname === item.path ? 700 : 400,
                transition: 'all 0.2s'
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
