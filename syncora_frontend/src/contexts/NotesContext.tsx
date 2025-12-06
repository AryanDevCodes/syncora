import React, { createContext, useContext, useState } from 'react';

const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notesState, setNotesState] = useState(null);

  return (
    <NotesContext.Provider value={{ notesState, setNotesState }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotesContext = () => useContext(NotesContext);