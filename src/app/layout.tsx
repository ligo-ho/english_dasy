import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'תרגול אוצר מילים באנגלית',
  description: 'אפליקציה מקומית לתרגול אוצר מילים באנגלית'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              תרגול אוצר מילים
            </Link>
            <nav className="main-nav">
              <Link href="/">דף הבית</Link>
              <Link href="/banks/new">יצירת מאגר חדש</Link>
              <Link href="/tests/new">יצירת מבחן חדש</Link>
            </nav>
          </div>
        </header>
        <main className="container site-main">{children}</main>
        <footer className="site-footer">
          <div className="container">אפליקציה מקומית · ללא חיבור אינטרנט · ללא משתמשים</div>
        </footer>
      </body>
    </html>
  );
}
