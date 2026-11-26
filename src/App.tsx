import React from 'react';
import { AnimatePresence } from 'motion/react';
import { RouterProvider, useRouter } from './lib/router';
import { ReservationProvider } from './context/ReservationContext';
import { DashboardProvider } from './context/DashboardContext';
import { Layout } from './components/Layout';
import { AskAndaaz } from './components/AskAndaaz';
import { HomePage } from './pages/HomePage';
import { OurStoryPage } from './pages/OurStoryPage';
import { MenuPage } from './pages/MenuPage';
import { GalleryPage } from './pages/GalleryPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { ExperienceDetailPage } from './pages/ExperienceDetailPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { getExperienceBySlug } from './data/experiences';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { ReservationsManagePage } from './pages/dashboard/ReservationsManagePage';
import { CalendarPage } from './pages/dashboard/CalendarPage';
import { AiConciergePage } from './pages/dashboard/AiConciergePage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { AvailabilitySettingsPage } from './pages/dashboard/AvailabilitySettingsPage';
import { AutomationSettingsPage } from './pages/dashboard/AutomationSettingsPage';
import { AutomationDemoPage } from './pages/dashboard/AutomationDemoPage';

function PublicRouteSwitch() {
  const { pathname } = useRouter();

  let page: React.ReactNode = <NotFoundPage />;

  if (pathname === '/') {
    page = <HomePage />;
  } else if (pathname === '/our-story') {
    page = <OurStoryPage />;
  } else if (pathname === '/menu') {
    page = <MenuPage />;
  } else if (pathname === '/gallery') {
    page = <GalleryPage />;
  } else if (pathname === '/reservations') {
    page = <ReservationsPage />;
  } else if (pathname === '/experiences') {
    page = <ExperiencesPage />;
  } else if (pathname === '/contact') {
    page = <ContactPage />;
  } else if (pathname.startsWith('/experiences/')) {
    const slug = pathname.replace('/experiences/', '');
    const exp = getExperienceBySlug(slug);
    if (exp) {
      page = <ExperienceDetailPage slug={exp.slug} />;
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname}>{page}</div>
    </AnimatePresence>
  );
}

function RootRouter() {
  const { pathname } = useRouter();

  const isDashboardOrDemo =
    pathname === '/staff-demo' ||
    pathname.startsWith('/staff-demo/') ||
    pathname === '/automation-demo';

  if (isDashboardOrDemo) {
    let dashboardPage: React.ReactNode = <OverviewPage />;
    if (pathname === '/staff-demo/reservations') {
      dashboardPage = <ReservationsManagePage />;
    } else if (pathname === '/staff-demo/calendar') {
      dashboardPage = <CalendarPage />;
    } else if (pathname === '/staff-demo/ai-concierge') {
      dashboardPage = <AiConciergePage />;
    } else if (pathname === '/staff-demo/customers') {
      dashboardPage = <CustomersPage />;
    } else if (pathname === '/staff-demo/notifications') {
      dashboardPage = <NotificationsPage />;
    } else if (pathname === '/staff-demo/analytics') {
      dashboardPage = <AnalyticsPage />;
    } else if (pathname === '/staff-demo/availability') {
      dashboardPage = <AvailabilitySettingsPage />;
    } else if (pathname === '/staff-demo/settings') {
      dashboardPage = <AutomationSettingsPage />;
    } else if (pathname === '/automation-demo') {
      dashboardPage = <AutomationDemoPage />;
    }

    return <DashboardProvider>{dashboardPage}</DashboardProvider>;
  }

  return (
    <Layout assistantSlot={<AskAndaaz />}>
      <PublicRouteSwitch />
    </Layout>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <ReservationProvider>
        <RootRouter />
      </ReservationProvider>
    </RouterProvider>
  );
}
