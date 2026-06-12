import { Space_Grotesk, Hanken_Grotesk } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
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
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          richColors
          position="bottom-right"
          mobileOffset={{ bottom: "80px" }}
          style={{
            "--normal-bg": "var(--surface)",
            "--normal-text": "var(--fg-1)",
            "--normal-border": "var(--border-2)",
            "--success-bg": "var(--surface)",
            "--success-text": "var(--fg-1)",
            "--success-border": "var(--success)",
            "--border-radius": "0px",
          }}
        />
      </body>
    </html>
  );
}
