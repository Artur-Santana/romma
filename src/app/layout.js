import { Public_Sans, Space_Grotesk, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const HankenGrotesks = Hanken_Grotesk({
  variable: "--font-Hanken_Grotesk",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "Romma",
  description: "Gestão de espaços corporativos",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
