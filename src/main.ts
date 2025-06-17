import Sigma from 'sigma';
import Graph, { MultiDirectedGraph } from 'graphology'; // Sigma.js usa Graphology per i dati del grafo
import type { Relationship } from '../generated/relationship';
import ForceSupervisor from "graphology-layout-force/worker";

import { runGrpcClient } from './grpc_client';
// import forceAtlas2 from 'graphology-layout-forceatlas2';

console.log("Starting GRPC server...")

console.log("GRPC server started!")

let rel1: Relationship = { label: "rel1", nodeFrom: "a", nodeTo: "b", props: { "a1": "b1", "a2": "b2" } };
let rel2: Relationship = { label: "rel2", nodeFrom: "b", nodeTo: "c", props: { "a1": "b1", "a2": "b2" } };
let rel3: Relationship = { label: "rel3", nodeFrom: "c", nodeTo: "a", props: { "a1": "b1", "a2": "b2" } };

function addRelationToGraph(relationship: Relationship, graph: Graph) {
  if (!graph.hasDirectedEdge(relationship.label)) {
    if (!graph.hasNode(relationship.nodeFrom))
      graph.addNode(relationship.nodeFrom, { label: relationship.nodeFrom, size: 10, x: Math.random(), y: Math.random(), color: '#00FF00' })
    if (!graph.hasNode(relationship.nodeTo))
      graph.addNode(relationship.nodeTo, { label: relationship.nodeTo, size: 10, x: Math.random(), y: Math.random(), color: '#00FF00' })
    graph.addDirectedEdgeWithKey(relationship.label, relationship.nodeFrom, relationship.nodeTo, { color: '#0000FF' })
  } else {
    console.log('Edge already added: ', relationship.label)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sigma-container');

  if (!container) {
    console.error('Element with ID "sigma-container" not found.');
    return;
  }

  // 1. Crea un'istanza di Graphology per definire i dati del grafo
  const graph = new MultiDirectedGraph();

  addRelationToGraph(rel1, graph)
  addRelationToGraph(rel2, graph)
  addRelationToGraph(rel3, graph)

  const layout = new ForceSupervisor(graph);
  layout.start();

  // 2. Inizializza Sigma.js
  const renderer = new Sigma(graph, container);

  // 3. Aggiungi listener per gli eventi (opzionale)
  renderer.on('clickNode', ({ node }) => {
    console.log(`Nodo cliccato: ${node}`);
    // Esempio: cambia il colore del nodo cliccato
    const currentColor = graph.getNodeAttribute(node, 'color');
    // graph.setNodeAttribute(node, 'color', currentColor === '#FF0000' ? '#00FFFF' : '#FF0000');
  });

  renderer.on('enterNode', ({ node }) => {
    console.log(`Mouse over nodo: ${node}`);
    // Esempio: aumenta la dimensione del nodo al passaggio del mouse
    graph.setNodeAttribute(node, 'size', graph.getNodeAttribute(node, 'size') * 1.5);
  });

  renderer.on('leaveNode', ({ node }) => {
    console.log(`Mouse leave nodo: ${node}`);
    // Esempio: ripristina la dimensione del nodo
    graph.setNodeAttribute(node, 'size', graph.getNodeAttribute(node, 'size') / 1.5);
  });

  renderer.on('doubleClickNode', ({ node }) => {
    console.log(`Mouse double click nodo: ${node}`);

    runGrpcClient(node)
      .subscribe({
        next: (relationship: Relationship) => {
          console.log("Relazione ricevuta:", relationship);
          addRelationToGraph(relationship, graph)
          // Questo viene chiamato per ogni messaggio Relationship ricevuto dallo stream
        },
        error: (err: Error) => {
          // Questo viene chiamato se si verifica un errore nello stream
          console.error("Errore nello stream gRPC-Web:", err);
          console.log(`Error: ${err.message || "Unknown error"}`);
        },
        complete: () => {
          // Questo viene chiamato quando lo stream è completato (il server ha finito di inviare messaggi)
          console.log("Stream gRPC-Web completato.");
          console.log("Stream completed.");
        },
      })
  });

  //
  // Drag'n'drop feature
  // ~~~~~~~~~~~~~~~~~~~
  //

  // State for drag'n'drop
  let draggedNode: string | null = null;
  let isDragging = false;

  // On mouse down on a node
  //  - we enable the drag mode
  //  - save in the dragged node in the state
  //  - highlight the node
  //  - disable the camera so its state is not updated
  renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
  });

  // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
  renderer.on("moveBody", ({ event }) => {
    if (!isDragging || !draggedNode) return;

    // Get new position of node
    const pos = renderer.viewportToGraph(event);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    // Prevent sigma to move camera:
    event.preventSigmaDefault();
    event.original.preventDefault();
    event.original.stopPropagation();
  });

  // On mouse up, we reset the dragging mode
  const handleUp = () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  };
  renderer.on("upNode", handleUp);
  renderer.on("upStage", handleUp);

  //
  // Create node (and edge) by click
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //

  // When clicking on the stage, we add a new node and connect it to the closest node
  renderer.on("clickStage", ({ event }: { event: { x: number; y: number } }) => {
    // Sigma (ie. graph) and screen (viewport) coordinates are not the same.
    // So we need to translate the screen x & y coordinates to the graph one by calling the sigma helper `viewportToGraph`
    const coordForGraph = renderer.viewportToGraph({ x: event.x, y: event.y });

    // TODO
  });

  console.log('Sigma.js initialized successfully!');
});
