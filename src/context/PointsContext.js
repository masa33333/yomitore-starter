"use client";

import { createContext, useContext } from "react";

const PointsContext = createContext({});

function PointsProvider({ children }) {
  return (
    <PointsContext.Provider value={{}}>
      {children}
    </PointsContext.Provider>
  );
}

export { PointsProvider };
export default PointsProvider;
export const usePoints = () => useContext(PointsContext);
