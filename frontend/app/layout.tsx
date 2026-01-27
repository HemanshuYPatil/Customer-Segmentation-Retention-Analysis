import "./globals.css";
import Providers from "@/components/providers";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

export const metadata = {
  title: "Customer Segmentation SaaS",
  description: "Enterprise dashboard for segmentation, churn, and LTV."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" data-theme="ocean">
      <body className="font-sans">
        <Providers>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ToastViewport />
            </ToastProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
