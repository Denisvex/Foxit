import { Link, useLocation } from 'react-router-dom';
import { Barbell, House, Microphone } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { t, useLang } from '../lib/i18n';

/**
 * Native bottom tab bar shared by all main screens.
 * No boxes: plain icons + labels, hairline separator, orange active state.
 * Element IDs are kept stable so helper-1.0 hint chips keep working.
 */
export default function TabBar() {
  useLang();
  const { pathname } = useLocation();

  const tabs: Array<{ to: string; id: string; label: string; Icon: Icon }> = [
    { to: '/dashboard', id: 'homeBtn', label: t('tabs.home'), Icon: House },
    { to: '/workouts', id: 'workoutsBtn', label: t('tabs.workouts'), Icon: Barbell },
    { to: '/models', id: 'modelsBtn', label: t('tabs.models'), Icon: Microphone },
  ];

  return (
    <nav
      aria-label={t('tabs.main_nav')}
      className="grid shrink-0 grid-cols-3 gap-1 border-t border-white/10 pt-1.5"
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
            className="rounded-xl px-2 py-1.5 text-center no-underline active:scale-[.97]"
          >
            <Icon
              size={22}
              weight={active ? 'fill' : 'regular'}
              className={`mx-auto block ${active ? 'text-[#FF6B35]' : 'text-[#8b8b96]'}`}
            />
            <span className={`mt-0.5 block text-[10px] font-black ${active ? 'text-[#FF6B35]' : 'text-[#8b8b96]'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
