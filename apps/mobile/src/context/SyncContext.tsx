import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { subscribeToNetworkEvents } from "../services/api-client";

interface SyncContextValue {
  isOffline: boolean;
  lastSyncedAt: string | null;
  reconnectVersion: number;
  reportSyncSuccess: (syncedAt?: string) => void;
  reportOffline: () => void;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * Single app-wide kitchen connectivity & sync coordinator for Mobile.
 * Listens to API transport outcomes, NetInfo cellular/Wi-Fi state, and AppState foreground
 * resume events so offline detection and automatic reconnection sync happen once globally
 * instead of per screen.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [reconnectVersion, setReconnectVersion] = useState(0);
  const wasOfflineRef = useRef(false);
  const lastForegroundSyncRef = useRef(Date.now());

  const reportSyncSuccess = useCallback((syncedAt?: string) => {
    wasOfflineRef.current = false;
    setIsOffline(false);
    setLastSyncedAt(syncedAt || new Date().toISOString());
  }, []);

  const reportOffline = useCallback(() => {
    wasOfflineRef.current = true;
    setIsOffline(true);
  }, []);

  useEffect(() => {
    const unsubscribeApi = subscribeToNetworkEvents((event) => {
      if (event.type === "online") {
        reportSyncSuccess(event.syncedAt);
      } else {
        reportOffline();
      }
    });

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected !== false && state.isInternetReachable !== false;
      if (!online) {
        reportOffline();
      } else if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        setIsOffline(false);
        setReconnectVersion((v) => v + 1);
      }
    });

    const appStateSub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          const elapsed = Date.now() - lastForegroundSyncRef.current;
          if (elapsed > 15_000 || wasOfflineRef.current) {
            lastForegroundSyncRef.current = Date.now();
            setReconnectVersion((v) => v + 1);
          }
        }
      }
    );

    return () => {
      unsubscribeApi();
      unsubscribeNetInfo();
      appStateSub.remove();
    };
  }, [reportOffline, reportSyncSuccess]);

  const value = useMemo(
    () => ({
      isOffline,
      lastSyncedAt,
      reconnectVersion,
      reportSyncSuccess,
      reportOffline,
    }),
    [isOffline, lastSyncedAt, reconnectVersion, reportSyncSuccess, reportOffline]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync must be used within a SyncProvider.");
  }
  return ctx;
}
