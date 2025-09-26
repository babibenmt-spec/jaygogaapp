import React, { ReactNode } from 'react';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-milk-100">
      <Header title={title} />
      <main className="pb-20 pt-4">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
