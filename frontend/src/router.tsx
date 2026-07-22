import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { MainLayout } from './features/layout/components/MainLayout';
import { FeatureErrorBoundary } from './components/error/FeatureErrorBoundary';
import { PageFallback } from './components/PageFallback';
import { LandingPage } from './features/landing/pages/LandingPage';
import { LegalPage } from './features/landing/pages/LegalPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { NotFoundPage } from './features/error/pages/NotFoundPage';
import { RequireAuth } from './features/auth/components/RequireAuth';
import type { LazyGate } from './components/room-gate/RoomGateLoader';
import { RoomGateLoader } from './components/room-gate/RoomGateLoader';

function roomRoute(
  path: string,
  featureName: string,
  gateLoader: () => Promise<LazyGate>,
  Page: React.LazyExoticComponent<React.ComponentType>,
): RouteObject {
  return {
    path,
    element: <RoomGateLoader gateLoader={gateLoader} featureName={featureName} Page={Page} />,
  };
}

function simpleRoute(
  path: string,
  featureName: string,
  Page: React.LazyExoticComponent<React.ComponentType>,
) {
  return {
    path,
    element: (
      <RequireAuth>
        <FeatureErrorBoundary featureName={featureName}>
          <Suspense fallback={<PageFallback />}>
            <Page />
          </Suspense>
        </FeatureErrorBoundary>
      </RequireAuth>
    ),
  };
}

function lazyComponent<T extends Record<string, React.ComponentType>>(
  importFn: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(() => importFn().then((m) => ({ default: m[exportName] })));
}

const MainMenuPage = lazyComponent(
  () => import('./features/menu/pages/MainMenuPage'),
  'MainMenuPage',
);
const PlanningPokerLobbyPage = lazyComponent(
  () => import('./features/planning-poker/pages/PlanningPokerLobbyPage'),
  'PlanningPokerLobbyPage',
);
const PlanningPokerRoomPage = lazyComponent(
  () => import('./features/planning-poker/pages/PlanningPokerRoomPage'),
  'PlanningPokerRoomPage',
);
const PlanningPokerResultsPage = lazyComponent(
  () => import('./features/planning-poker/pages/PlanningPokerResultsPage'),
  'PlanningPokerResultsPage',
);
const PlanningPokerParticipantsPage = lazyComponent(
  () => import('./features/planning-poker/pages/PlanningPokerParticipantsPage'),
  'PlanningPokerParticipantsPage',
);
const RetroPage = lazyComponent(() => import('./features/retro/pages/RetroPage'), 'RetroPage');
const RetroRoomPage = lazyComponent(
  () => import('./features/retro/pages/RetroRoomPage'),
  'RetroRoomPage',
);
const RetroParticipantsPage = lazyComponent(
  () => import('./features/retro/pages/RetroParticipantsPage'),
  'RetroParticipantsPage',
);
const NotesPage = lazyComponent(() => import('./features/notes/pages/NotesPage'), 'NotesPage');
const KanbanLobbyPage = lazyComponent(
  () => import('./features/kanban/pages/KanbanLobbyPage'),
  'KanbanLobbyPage',
);
const KanbanBoardPage = lazyComponent(
  () => import('./features/kanban/pages/KanbanBoardPage'),
  'KanbanBoardPage',
);
const KanbanParticipantsPage = lazyComponent(
  () => import('./features/kanban/pages/KanbanParticipantsPage'),
  'KanbanParticipantsPage',
);
const KanbanBoardConfigPage = lazyComponent(
  () => import('./features/kanban/pages/KanbanBoardConfigPage'),
  'KanbanBoardConfigPage',
);
const KanbanCardPage = lazyComponent(
  () => import('./features/kanban/pages/KanbanCardPage'),
  'KanbanCardPage',
);
const KanbanCardCommentsPage = lazyComponent(
  () => import('./features/kanban/pages/KanbanCardCommentsPage'),
  'KanbanCardCommentsPage',
);
const ProfilePage = lazyComponent(() => import('./features/auth/pages/ProfilePage'), 'ProfilePage');

const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      simpleRoute('/tools', 'Main Menu', MainMenuPage),
      simpleRoute('/tools/profile', 'Profile', ProfilePage),

      // Planning Poker
      simpleRoute('/tools/planning-poker', 'Planning Poker', PlanningPokerLobbyPage),
      roomRoute(
        '/tools/planning-poker/:roomId',
        'Planning Poker',
        () =>
          Promise.all([
            import('./features/planning-poker/store/planningPokerStore'),
            import('./features/planning-poker/planningPokerHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'planningPoker',
            lobbyPath: '/tools/planning-poker',
            useStore: store.usePlanningPokerStore,
            joinRoom: hub.joinRoom,
          })),
        PlanningPokerRoomPage,
      ),
      roomRoute(
        '/tools/planning-poker/:roomId/results',
        'Planning Poker',
        () =>
          Promise.all([
            import('./features/planning-poker/store/planningPokerStore'),
            import('./features/planning-poker/planningPokerHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'planningPoker',
            lobbyPath: '/tools/planning-poker',
            useStore: store.usePlanningPokerStore,
            joinRoom: hub.joinRoom,
          })),
        PlanningPokerResultsPage,
      ),
      roomRoute(
        '/tools/planning-poker/:roomId/participants',
        'Planning Poker',
        () =>
          Promise.all([
            import('./features/planning-poker/store/planningPokerStore'),
            import('./features/planning-poker/planningPokerHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'planningPoker',
            lobbyPath: '/tools/planning-poker',
            useStore: store.usePlanningPokerStore,
            joinRoom: hub.joinRoom,
          })),
        PlanningPokerParticipantsPage,
      ),

      // Retro
      simpleRoute('/tools/retro', 'Retro', RetroPage),
      roomRoute(
        '/tools/retro/:roomId',
        'Retro',
        () =>
          Promise.all([
            import('./features/retro/store/retroStore'),
            import('./features/retro/retroHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'retro',
            lobbyPath: '/tools/retro',
            useStore: store.useRetroStore,
            joinRoom: hub.joinRoom,
          })),
        RetroRoomPage,
      ),
      roomRoute(
        '/tools/retro/:roomId/participants',
        'Retro',
        () =>
          Promise.all([
            import('./features/retro/store/retroStore'),
            import('./features/retro/retroHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'retro',
            lobbyPath: '/tools/retro',
            useStore: store.useRetroStore,
            joinRoom: hub.joinRoom,
          })),
        RetroParticipantsPage,
      ),

      // Notes
      simpleRoute('/tools/notes', 'Notes', NotesPage),

      // Kanban
      simpleRoute('/tools/kanban', 'Kanban', KanbanLobbyPage),
      roomRoute(
        '/tools/kanban/:roomId',
        'Kanban',
        () =>
          Promise.all([
            import('./features/kanban/store/kanbanStore'),
            import('./features/kanban/kanbanHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'kanban',
            lobbyPath: '/tools/kanban',
            useStore: store.useKanbanStore,
            joinRoom: hub.joinRoom,
          })),
        KanbanBoardPage,
      ),
      roomRoute(
        '/tools/kanban/:roomId/participants',
        'Kanban',
        () =>
          Promise.all([
            import('./features/kanban/store/kanbanStore'),
            import('./features/kanban/kanbanHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'kanban',
            lobbyPath: '/tools/kanban',
            useStore: store.useKanbanStore,
            joinRoom: hub.joinRoom,
          })),
        KanbanParticipantsPage,
      ),
      roomRoute(
        '/tools/kanban/:roomId/config',
        'Kanban',
        () =>
          Promise.all([
            import('./features/kanban/store/kanbanStore'),
            import('./features/kanban/kanbanHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'kanban',
            lobbyPath: '/tools/kanban',
            useStore: store.useKanbanStore,
            joinRoom: hub.joinRoom,
          })),
        KanbanBoardConfigPage,
      ),
      roomRoute(
        '/tools/kanban/:roomId/:cardId/comments',
        'Kanban',
        () =>
          Promise.all([
            import('./features/kanban/store/kanbanStore'),
            import('./features/kanban/kanbanHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'kanban',
            lobbyPath: '/tools/kanban',
            useStore: store.useKanbanStore,
            joinRoom: hub.joinRoom,
          })),
        KanbanCardCommentsPage,
      ),
      roomRoute(
        '/tools/kanban/:roomId/:cardId',
        'Kanban',
        () =>
          Promise.all([
            import('./features/kanban/store/kanbanStore'),
            import('./features/kanban/kanbanHub'),
          ]).then(([store, hub]) => ({
            featureKey: 'kanban',
            lobbyPath: '/tools/kanban',
            useStore: store.useKanbanStore,
            joinRoom: hub.joinRoom,
          })),
        KanbanCardPage,
      ),
    ],
  },
  { path: '/legal', element: <LegalPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
