import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Compass, Home as HomeIcon, Sparkles, UserRound, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './lib/store';
import { Logo, ToastProvider, cx, spring } from './components/ui';
import Home from './screens/Home';
import Assist from './screens/Assist';
import Onboarding from './screens/Onboarding';
import BubbleDemo from './screens/BubbleDemo';
import { PeopleList, PersonDetail } from './screens/People';
import Discover from './screens/Discover';
import Profile from './screens/Profile';
import Upgrade from './screens/Upgrade';
import HistoryDetail from './screens/HistoryDetail';

const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/people', label: 'People', icon: Users },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

function BottomNav() {
  const nav = useNavigate();
  return (
    <motion.nav initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={spring} className="absolute inset-x-3 bottom-3 z-40" aria-label="Main">
      <div className="relative flex items-center rounded-[28px] border border-line-strong bg-glass p-1.5 shadow-card backdrop-blur-2xl">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => nav('/assist/snap')}
          aria-label="New reply"
          className="mx-1 grid size-14 shrink-0 -translate-y-3 place-items-center rounded-full bg-gradient-to-br from-indigo-2 to-indigo text-white shadow-[0_12px_30px_-6px_rgba(99,91,255,.9)]"
        >
          <Sparkles size={22} />
        </motion.button>
        {TABS.slice(2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </div>
    </motion.nav>
  );
}

function Tab({ to, label, icon: Icon }: (typeof TABS)[number]) {
  return (
    <NavLink to={to} end={to === '/'} className="relative flex flex-1 flex-col items-center gap-0.5 py-2">
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="tab" transition={spring} className="absolute inset-0 rounded-[22px] bg-surface-2" />}
          <Icon size={20} className={cx('relative transition-colors', isActive ? 'text-indigo-2' : 'text-muted')} />
          <span className={cx('relative text-[10.5px] font-medium', isActive ? 'text-ink' : 'text-muted')}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function AppScreens() {
  const location = useLocation();
  const store = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const showNav = ['/', '/people', '/discover', '/profile'].includes(location.pathname);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (!store.settings.onboarded) {
    return <Onboarding onDone={() => scrollRef.current?.scrollTo({ top: 0 })} />;
  }

  return (
    <>
      <div ref={scrollRef} className="no-scrollbar relative h-full overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/assist/:kind" element={<Assist />} />
              <Route path="/bubble" element={<BubbleDemo />} />
              <Route path="/people" element={<PeopleList />} />
              <Route path="/people/:id" element={<PersonDetail />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/history/:id" element={<HistoryDetail />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>{showNav && <BottomNav />}</AnimatePresence>
    </>
  );
}

/** Desktop: the app sits in a device frame beside the brand story. Mobile: full screen. */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-full overflow-hidden bg-bg lg:flex lg:items-center lg:justify-center lg:gap-20 lg:p-8">
        <div className="aurora grain pointer-events-none absolute inset-0 hidden lg:block" />
        <BrandPanel />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="relative h-[100dvh] w-full bg-bg lg:h-[860px] lg:max-h-[calc(100dvh-64px)] lg:w-[410px] lg:shrink-0 lg:overflow-hidden lg:rounded-[54px] lg:border-[10px] lg:border-[#05080f] lg:shadow-[0_60px_120px_-30px_rgba(0,0,0,.65),0_0_0_1px_rgba(255,255,255,.08)]"
        >
          <div className="pointer-events-none absolute top-2.5 left-1/2 z-[90] hidden h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-[#05080f] lg:block" />
          <ToastProvider>
            <div className="relative h-full lg:pt-8">
              <AppScreens />
            </div>
          </ToastProvider>
        </motion.div>
      </div>
    </MotionConfig>
  );
}

function BrandPanel() {
  const words = ['dating apps', 'WhatsApp', 'Instagram DMs', 'email', 'LinkedIn'];
  return (
    <div className="relative hidden max-w-[440px] lg:block">
      <Logo size={34} />
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-10 font-display text-[76px] leading-[0.9] tracking-tight">
        Know what to say <em className="text-gradient">next.</em>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-6 text-[17px] leading-relaxed text-ink-2">
        EasyChat floats over your chats, reads what you choose to share, and gives you three replies that sound like <em>you</em> - across <RotatingWord words={words} />
      </motion.p>
      <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }} className="mt-8 grid grid-cols-2 gap-3">
        {[
          ['3 taps', 'bubble → snap → pick'],
          ['< 4s', 'from tap to replies'],
          ['24h', 'screenshots auto-deleted'],
          ['0', 'messages ever auto-sent'],
        ].map(([k, v]) => (
          <motion.li key={k} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="rounded-3xl border border-line bg-surface/60 p-4 backdrop-blur">
            <p className="text-[26px] font-semibold tracking-tight">{k}</p>
            <p className="text-[13px] text-muted">{v}</p>
          </motion.li>
        ))}
      </motion.ul>
      <p className="mt-8 text-[12.5px] text-muted">Web preview of the Android-first app · drag the bubble in "Try the bubble".</p>
    </div>
  );
}

function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % words.length), 2000);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className="relative inline-block min-w-[9ch] align-bottom">
      <AnimatePresence mode="wait">
        <motion.span key={i} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="inline-block font-semibold text-ink">
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
