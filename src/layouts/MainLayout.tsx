
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
    <div className="flex flex-col min-h-screen dark">
      <Header />
      <div className="flex flex-grow">
        <Sidebar />
        <div className="flex flex-col flex-grow">
          <TopBar />
          <main className="flex-grow px-6 py-6">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
