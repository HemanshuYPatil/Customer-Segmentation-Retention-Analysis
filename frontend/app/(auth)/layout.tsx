export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="bg-grid min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
