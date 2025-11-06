import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Appbar } from '@/components/layout/Appbar';
import { ClientOnly } from '@/components/common/ClientOnly';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <ClientOnly
          fallback={
            <div className="w-64 bg-white border-r">
              <div className="flex h-16 items-center px-6">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900"></div>
                  <span className="text-lg font-semibold text-slate-900">
                    Money Manager
                  </span>
                </div>
              </div>
            </div>
          }
        >
          <Sidebar />
        </ClientOnly>

        {/* Desktop Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen bg-gray-50">
        {/* Mobile Topbar */}
        <ClientOnly>
          <Topbar />
        </ClientOnly>

        {/* Mobile Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-16">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <ClientOnly>
          <Appbar />
        </ClientOnly>
      </div>
    </ProtectedRoute>
  );
}
