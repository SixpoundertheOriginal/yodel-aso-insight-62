
import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen dark bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />
      <div className="flex flex-grow">
        <Sidebar />
        <div className="flex flex-col flex-grow">
          <TopBar />
          <main className="flex-grow px-6 py-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
