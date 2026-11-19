import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fantasyApi } from "./api";

const MemberContext = createContext(null);

/** Knows who is signed in (via the HttpOnly session cookie) and exposes login/logout. */
export function MemberProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { member: m } = await fantasyApi("me");
      setMember(m);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns { member } when signed in, or { pending, message } when a registration needs email confirmation. */
  const signIn = useCallback(async (mode, form) => {
    const res = await fantasyApi(mode === "register" ? "register" : "login", form);
    if (res.pending || res.verify) return { pending: true, message: res.message };
    setMember(res.member);
    return { member: res.member };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fantasyApi("logout", {});
    } finally {
      setMember(null);
    }
  }, []);

  const value = useMemo(() => ({ member, loading, refresh, signIn, signOut, setMember }), [member, loading, refresh, signIn, signOut]);
  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used inside <MemberProvider>");
  return ctx;
}
