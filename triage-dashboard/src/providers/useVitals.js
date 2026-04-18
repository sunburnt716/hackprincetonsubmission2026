import { useContext } from "react";
import { VitalsContext } from "./vitalsContext";

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error("useVitals must be used inside VitalsProvider");
  }

  return context;
};
