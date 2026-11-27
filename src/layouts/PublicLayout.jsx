import React from 'react';
import { Outlet } from 'react-router-dom';
import SkipToContent from '../components/layout/SkipToContent';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-light-background dark:bg-dark-background text-light-on-background dark:text-dark-on-background antialiased">
      <SkipToContent />
      <Header />
      <main id="main-content" className="flex-1 w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
