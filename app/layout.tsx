import type { Metadata } from "next";
import "./globals.css";
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';

export const metadata: Metadata = {
  title: "Sistema de Siniestros",
  description: "Plataforma de gestión y procesamiento de planillas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? await verifyJWT(token) : null;
  const username = payload?.username as string | undefined;

  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
