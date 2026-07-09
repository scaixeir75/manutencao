import { CalendarDays, ClipboardList, History } from 'lucide-react';

export type AppRoute = 'weekly-plan' | 'daily-records' | 'history';

export const appRoutes = [
  {
    id: 'weekly-plan',
    label: 'Plano da Semana',
    icon: CalendarDays,
  },
  {
    id: 'daily-records',
    label: 'Registos Diários',
    icon: ClipboardList,
  },
  {
    id: 'history',
    label: 'Histórico',
    icon: History,
  },
] satisfies Array<{
  id: AppRoute;
  label: string;
  icon: typeof CalendarDays;
}>;
