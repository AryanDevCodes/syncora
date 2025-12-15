import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshAccessToken,
  logoutUser,
  type UserDto,
  type LoginRequest,
  type SignupRequest,
} from "@/services/authService";

// --------------------------------------------------
// User Type
// --------------------------------------------------
interface User {
  username: string;
  id: number;
  userId?: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: "online" | "away" | "offline";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;

  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --------------------------------------------------
// Provider
// --------------------------------------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // JWT Tokens
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken")
  );

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --------------------------------------------------
  // Map JWT user DTO to internal User type
  // --------------------------------------------------
  const mapUserDto = (dto: UserDto): User => {
    const email = dto.email || dto.userEmail || "";
    const id = Number(dto.id || dto.userId || 0);

    return {
      username: email,
      id,
      userId: dto.userId,
      name: `${dto.firstName} ${dto.lastName}`,
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatar: dto.avatarUrl,
      status: "online",
    };
  };

  // --------------------------------------------------
  // Load user on first mount if token exists
  // --------------------------------------------------
  useEffect(() => {
    const init = async () => {
      // Check localStorage for most recent token (in case it was updated by OAuth callback)
      const storedToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const dto = await getCurrentUser(storedToken);
        const mapped = mapUserDto(dto);

        console.log("✅ User fetched successfully:", mapped.email);
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(mapped);
        localStorage.setItem("userEmail", mapped.email);
      } catch (err: any) {
        console.error("❌ Error fetching user:", err?.response?.status, err?.message);
        // Token expired → Try refreshing
        if (storedRefreshToken) {
          try {
            console.log("🔄 Attempting to refresh token...");
            const newTokens = await refreshAccessToken(storedRefreshToken);

            console.log("✅ Token refreshed successfully");
            setToken(newTokens.token);
            setRefreshToken(newTokens.refreshToken);

            localStorage.setItem("accessToken", newTokens.token);
            localStorage.setItem("refreshToken", newTokens.refreshToken);

            const dto2 = await getCurrentUser(newTokens.token);
            console.log("✅ User fetched with new token:", dto2.email);
            setUser(mapUserDto(dto2));
          } catch (refreshFail: any) {
            console.error("❌ Token refresh failed:", refreshFail?.response?.status, refreshFail?.message);
            internalLogout();
          }
        } else {
          console.error("❌ No refresh token available, logging out");
          internalLogout();
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  // --------------------------------------------------
  // Login
  // --------------------------------------------------
  const login = async (email: string, password: string) => {
    const body: LoginRequest = { email, password };
    const jwt = await loginUser(body);

    // Save JWT tokens
    setToken(jwt.token);
    setRefreshToken(jwt.refreshToken);

    localStorage.setItem("accessToken", jwt.token);
    localStorage.setItem("refreshToken", jwt.refreshToken);

    // Load the user profile
    const dto = await getCurrentUser(jwt.token);
    const mapped = mapUserDto(dto);

    setUser(mapped);
    localStorage.setItem("userEmail", mapped.email);
  };

  // --------------------------------------------------
  // Signup
  // --------------------------------------------------
  const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    const body: SignupRequest = { firstName, lastName, email, password };
    await registerUser(body);

    return login(email, password);
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  const internalLogout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);

    // Remove everything
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
    internalLogout();
  };

  // --------------------------------------------------
  // Provider return
  // --------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,

        login,
        signup,
        logout,

        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------------
// Hook
// --------------------------------------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
