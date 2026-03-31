"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDefaultSession,
  loadAutoLoopSession,
  persistAutoLoopSession,
  type AutoLoopSession,
} from "@/lib/p0/auto-loop/session";

type SessionUpdater = (current: AutoLoopSession) => AutoLoopSession;

export function useAutoLoopSession() {
  const [session, setSessionState] = useState<AutoLoopSession>(() => createDefaultSession());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSessionState(loadAutoLoopSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    persistAutoLoopSession(session);
  }, [hydrated, session]);

  const remainingQuota = useMemo(
    () => Math.max(0, session.dailyLimit - session.usedToday),
    [session.dailyLimit, session.usedToday]
  );

  function setSession(updater: SessionUpdater) {
    setSessionState((current) => updater(current));
  }

  return {
    session,
    setSession,
    hydrated,
    remainingQuota,
  };
}
