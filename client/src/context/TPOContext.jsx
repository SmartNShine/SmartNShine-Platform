import { createContext, useContext, useState, useEffect } from "react";
import { tpoAuthAPI } from "@/api/tpo.api";
import { authStorage } from "@/utils/storage";
import { isCampusSuspended } from "@/utils/campusStatus";

const TPOContext = createContext(null);

export const TPOProvider = ({ children }) => {
  const [tpoUser, setTpoUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const token = authStorage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const storedUser = authStorage.getUser();
    if (storedUser?.role && storedUser.role !== "tpo") {
      setLoading(false);
      return;
    }
    try {
      const res = await tpoAuthAPI.getProfile();
      setTpoUser(res.data.data.user);
      setInstitution(res.data.data.institution);
    } catch {
      // Token may be for a non-TPO user — that's fine
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loginTpo = async (credentials) => {
    const res = await tpoAuthAPI.login(credentials);
    const { token, user, institution: inst } = res.data;
    authStorage.setToken(token);
    authStorage.setUser(user);
    setTpoUser(user);
    setInstitution(inst);
    return res.data;
  };

  const setAuthData = (token, user, inst) => {
    if (token) authStorage.setToken(token);
    if (user) authStorage.setUser(user);
    if (user) setTpoUser(user);
    if (inst) setInstitution(inst);
  };

  const logoutTpo = () => {
    authStorage.clearAuth();
    setTpoUser(null);
    setInstitution(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await tpoAuthAPI.getProfile();
      const user = res.data?.data?.user;
      const inst = res.data?.data?.institution;
      if (user) setTpoUser(user);
      if (inst) setInstitution(inst);
      return {
        user,
        institution: inst,
        isCampusActive: !isCampusSuspended(inst?.status),
      };
    } catch (err) {
      console.warn("Failed to refresh TPO profile:", err);
      return null;
    }
  };

  return (
    <TPOContext.Provider
      value={{
        tpoUser,
        institution,
        loading,
        loginTpo,
        logoutTpo,
        refreshProfile,
        setAuthData,
        isCampusActive: !isCampusSuspended(institution?.status),
      }}
    >
      {children}
    </TPOContext.Provider>
  );
};

export const useTPO = () => {
  const ctx = useContext(TPOContext);
  if (!ctx) throw new Error("useTPO must be used within TPOProvider");
  return ctx;
};

