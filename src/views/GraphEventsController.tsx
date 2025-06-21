import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { FC, PropsWithChildren, useEffect } from "react";
import { Relationship } from "./generated/relationship";
import { getRelationships } from "./ProtoClient";

function getMouseLayer() {
  return document.querySelector(".sigma-mouse");
}

const GraphEventsController: FC<PropsWithChildren<{ setHoveredNode: (node: string | null) => void }>> = ({
  setHoveredNode,
  children,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const registerEvents = useRegisterEvents();

  /**
   * Initialize here settings that require to know the graph and/or the sigma
   * instance:
   */
  useEffect(() => {
    registerEvents({
      clickNode({ node }) {
        if (!graph.getNodeAttribute(node, "hidden")) {
          // window.open(graph.getNodeAttribute(node, "URL"), "_blank");
        }
      },
      enterNode({ node }) {
        setHoveredNode(node);
        // TODO: Find a better way to get the DOM mouse layer:
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.add("mouse-pointer");
      },
      leaveNode() {
        setHoveredNode(null);
        // TODO: Find a better way to get the DOM mouse layer:
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.remove("mouse-pointer");
      },
      doubleClickNode({ event, node }) {
        event.preventSigmaDefault();
        
        if (!graph.getNodeAttribute(node, "hidden")) {
          getRelationships(node)
            .subscribe({
              next: (relationship: Relationship) => {
                console.log("Relazione ricevuta:", relationship);
                // addRelationToGraph(relationship, graph)
              },
              error: (err: Error) => {
                console.error("Errore nello stream gRPC-Web:", err);
                console.log(`Error: ${err.message || "Unknown error"}`);
              },
              complete: () => {
                console.log("Stream gRPC-Web completato.");
                console.log("Stream completed.");
              },
            })
        }
      }
    });
  }, []);

  return <>{children}</>;
};

export default GraphEventsController;
