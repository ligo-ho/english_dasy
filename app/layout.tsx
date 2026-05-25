import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <header className="topbar">
          <h1>מאמן אוצר מילים באנגלית</h1>
          <Link href="/">דף הבית</Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
