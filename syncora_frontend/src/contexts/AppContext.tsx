import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  activeModule: "chat" | "video" | "tasks" | "notes";
  setActiveModule: (module: "chat" | "video" | "tasks" | "notes") => void;
  activeRoom: string | null;
  setActiveRoom: (roomId: string | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<"chat" | "video" | "tasks" | "notes">("chat");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(
    localStorage.getItem("userEmail")
  );

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        activeRoom,
        setActiveRoom,
        userEmail,
        setUserEmail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};