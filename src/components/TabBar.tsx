import { Link, useLocation } from 'react-router-dom';
import { Barbell, House, Microphone } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

/**
 * Native bottom tab bar shared by all main screens.
 * Element IDs are kept stable so helper-1.0 hint chips keep working.
 */
export default function TabBar() {
  const { pathname } = useLocation();

  const tabs: Array<{ to: string; id: string; label: string; Icon: Icon }> = [
    { to: '/dashboard', id: 'homeBtn', label: 'home', Icon: House },
    { to: '/workouts', id: 'workoutsBtn', label: 'workouts', Icon: Barbell },
    { to: '/models', id: 'modelsBtn', label: 'models', Icon: Microphone },
  ];

  return (
    <nav
      aria-label="main"
      className="grid shrink-0 grid-cols-3 gap-2 pt-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, id, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            id={id}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`rounded-2xl border px-2 py-2 text-center no-underline active:scale-[.97] ${
              active ? 'border-[#FF6B35]/60' : 'border-white/10'
            }`}
            style={active ? { background: 'rgba(255,107,53,.14)' } : { background: 'rgba(255,255,255,.03)' }}
          >
            <Icon
              size={20}
              weight={active ? 'fill' : 'regular'}
              className={`mx-auto block ${active ? 'text-[#FF6B35]' : 'text-[#cfcfd6]'}`}
            />
            <span className={`mt-1 block text-[10px] font-black ${active ? 'text-[#FF6B35]' : ''}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
