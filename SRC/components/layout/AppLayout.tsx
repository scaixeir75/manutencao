import type { ReactNode } from 'react';
import { appRoutes, type AppRoute } from '../../app/routes';

type AppLayoutProps = {
  activeRoute: AppRoute;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
};

export function AppLayout({ activeRoute, children, onNavigate }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <span className="brand-mark">PMP</span>
          <div>
            <strong>Manutenção Preventiva</strong>
            <span>Registos e fichas</span>
          </div>
        </div>

        <nav className="nav-list">
          {appRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = route.id === activeRoute;

            return (
              <button
                className={isActive ? 'nav-item active' : 'nav-item'}
                key={route.id}
                onClick={() => onNavigate(route.id)}
                type="button"
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{route.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
