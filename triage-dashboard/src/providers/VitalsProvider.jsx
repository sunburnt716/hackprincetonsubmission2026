import useKinovoPipeline from "./useKinovoPipeline";
import { VitalsContext } from "./vitalsContext";

function VitalsProvider({ children }) {
  const pipelineValue = useKinovoPipeline();

  return (
    <VitalsContext.Provider value={pipelineValue}>
      {children}
    </VitalsContext.Provider>
  );
}

export default VitalsProvider;
