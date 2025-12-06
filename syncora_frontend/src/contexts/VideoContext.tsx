import React, { createContext, useContext } from 'react';

// Video functionality removed — keep a minimal provider stub to avoid import errors.
const VideoContext = createContext<any>(null);
export const useVideo = () => useContext(VideoContext);

export const VideoProvider: React.FC<any> = ({ children }) => {
  return <>{children}</>;
};
