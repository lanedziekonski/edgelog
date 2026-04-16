import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';

function PageWrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route index element={<PageWrap><Home /></PageWrap>} />
          <Route path="features" element={<PageWrap><Features /></PageWrap>} />
          <Route path="pricing" element={<PageWrap><Pricing /></PageWrap>} />
          <Route path="about" element={<PageWrap><About /></PageWrap>} />
          <Route path="how-it-works" element={<PageWrap><HowItWorks /></PageWrap>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
