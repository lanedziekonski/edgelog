import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import CursorSpotlight from '../effects/CursorSpotlight';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink relative">
      <CursorSpotlight />
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
