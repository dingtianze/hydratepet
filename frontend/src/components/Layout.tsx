import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 safe-area-top safe-area-x pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
