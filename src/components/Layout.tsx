
import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 flex flex-col justify-center items-center p-4">
      <div className={cn("w-full relative transition-all-300", className)}>
        {children}
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground opacity-70 transition-all-300 hover:opacity-100">
        <p>Designed with simplicity and elegance in mind</p>
      </footer>
    </div>
  );
};

export default Layout;
