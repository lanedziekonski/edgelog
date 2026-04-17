import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import CursorSpotlight from '../effects/CursorSpotlight';
import AnimatedBackground from '../effects/AnimatedBackground';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink relative">
      <AnimatedBackground fixed />
      <CursorSpotlight />
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-16 relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
