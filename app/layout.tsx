import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"COREBOLT 2.0 | DURALCO Industrial",description:"ERP industrial SQL — ambiente de desarrollo"};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es"><body>{children}</body></html>; }
