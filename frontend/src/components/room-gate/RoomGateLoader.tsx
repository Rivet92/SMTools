import { lazy, useEffect, useState, Suspense } from 'react';
import { RequireAuth } from '../../features/auth/components/RequireAuth';
import { FeatureErrorBoundary } from '../error/FeatureErrorBoundary';
import { PageFallback } from '../PageFallback';

const RoomGate = lazy(() => import('./RoomGate').then((m) => ({ default: m.RoomGate })));

export interface LazyGate {
  featureKey: string;
  lobbyPath: string;
  useStore: unknown;
  joinRoom: unknown;
}

interface RoomGateLoaderProps {
  gateLoader: () => Promise<LazyGate>;
  featureName: string;
  Page: React.LazyExoticComponent<React.ComponentType>;
}

export function RoomGateLoader({ gateLoader, featureName, Page }: RoomGateLoaderProps) {
  const [gate, setGate] = useState<LazyGate | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    gateLoader()
      .then((g) => {
        if (!cancelled) setGate(g);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [gateLoader]);

  if (error) throw error;
  if (!gate) return <PageFallback />;

  const roomGateProps = {
    featureKey: gate.featureKey,
    lobbyPath: gate.lobbyPath,
    useStore: gate.useStore as never,
    joinRoom: gate.joinRoom as never,
  };

  return (
    <Suspense fallback={<PageFallback />}>
      <RequireAuth>
        <RoomGate {...roomGateProps}>
          <FeatureErrorBoundary featureName={featureName}>
            <Suspense fallback={<PageFallback />}>
              <Page />
            </Suspense>
          </FeatureErrorBoundary>
        </RoomGate>
      </RequireAuth>
    </Suspense>
  );
}
