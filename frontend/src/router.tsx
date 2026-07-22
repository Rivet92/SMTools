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
import { RoomGate } from './components/room-gate/RoomGate';
import { joinRoom as joinPlanningPokerRoom } from './features/planning-poker/planningPokerHub';
import { usePlanningPokerStore } from './features/planning-poker/store/planningPokerStore';
import { joinRoom as joinRetroRoom } from './features/retro/retroHub';
import { useRetroStore } from './features/retro/store/retroStore';
import { joinRoom as joinKanbanRoom } from './features/kanban/kanbanHub';
import { useKanbanStore } from './features/kanban/store/kanbanStore';
import type { ConnectionState } from './stores/createRoomStore';

type RoomStateBase = {
  id: string;
  ownParticipantId: string;
  version: number;
};

type GateStore<TState extends RoomStateBase> = {
  room: TState | null;
  setRoom: (room: TState) => void;
  setError: (error: string | null) => void;
  connectionState: ConnectionState;
};

function roomRoute<TState extends RoomStateBase>(
  path: string,
  featureName: string,
  gate: {
    featureKey: string;
    lobbyPath: string;
    useStore: {
      <U>(selector: (state: GateStore<TState>) => U): U;
      getState: () => GateStore<TState>;
    };
    joinRoom: (roomId: string, password?: string) => Promise<TState>;
  },
  Page: React.LazyExoticComponent<React.ComponentType>,
) {
  return {
    path,
    element: (
      <RequireAuth>
        <RoomGate
          featureKey={gate.featureKey}
          lobbyPath={gate.lobbyPath}
          useStore={gate.useStore}
          joinRoom={gate.joinRoom}
        >
          <FeatureErrorBoundary featureName={featureName}>
            <Suspense fallback={<PageFallback />}>
              <Page />
            </Suspense>
          </FeatureErrorBoundary>
        </RoomGate>
      </RequireAuth>
    ),
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

const MainMenuPage = lazyComponent(() => import('./features/menu/pages/MainMenuPage'), 'MainMenuPage');
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
const ProfilePage = lazyComponent(
  () => import('./features/auth/pages/ProfilePage'),
  'ProfilePage',
);

const planningPokerGate = {
  featureKey: 'planningPoker' as const,
  lobbyPath: '/tools/planning-poker',
  useStore: usePlanningPokerStore,
  joinRoom: joinPlanningPokerRoom,
};

const retroGate = {
  featureKey: 'retro' as const,
  lobbyPath: '/tools/retro',
  useStore: useRetroStore,
  joinRoom: joinRetroRoom,
};

const kanbanGate = {
  featureKey: 'kanban' as const,
  lobbyPath: '/tools/kanban',
  useStore: useKanbanStore,
  joinRoom: joinKanbanRoom,
};

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
      roomRoute('/tools/planning-poker/:roomId', 'Planning Poker', planningPokerGate, PlanningPokerRoomPage),
      roomRoute('/tools/planning-poker/:roomId/results', 'Planning Poker', planningPokerGate, PlanningPokerResultsPage),
      roomRoute('/tools/planning-poker/:roomId/participants', 'Planning Poker', planningPokerGate, PlanningPokerParticipantsPage),

      // Retro
      simpleRoute('/tools/retro', 'Retro', RetroPage),
      roomRoute('/tools/retro/:roomId', 'Retro', retroGate, RetroRoomPage),
      roomRoute('/tools/retro/:roomId/participants', 'Retro', retroGate, RetroParticipantsPage),

      // Notes
      simpleRoute('/tools/notes', 'Notes', NotesPage),

      // Kanban
      simpleRoute('/tools/kanban', 'Kanban', KanbanLobbyPage),
      roomRoute('/tools/kanban/:roomId', 'Kanban', kanbanGate, KanbanBoardPage),
      roomRoute('/tools/kanban/:roomId/participants', 'Kanban', kanbanGate, KanbanParticipantsPage),
      roomRoute('/tools/kanban/:roomId/config', 'Kanban', kanbanGate, KanbanBoardConfigPage),
      roomRoute('/tools/kanban/:roomId/:cardId/comments', 'Kanban', kanbanGate, KanbanCardCommentsPage),
      roomRoute('/tools/kanban/:roomId/:cardId', 'Kanban', kanbanGate, KanbanCardPage),
    ],
  },
  { path: '/legal', element: <LegalPage /> },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
