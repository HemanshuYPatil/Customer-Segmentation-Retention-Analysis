import "./globals.css";
import Providers from "@/components/providers";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

export const metadata = {
  title: "Customer Segmentation SaaS",
  description: "Enterprise dashboard for segmentation, churn, and LTV."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <Providers>
          <ToastProvider>
            {children}
            <ToastViewport />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
