import Sigma from 'sigma';
import Graph, { MultiDirectedGraph } from 'graphology';
import type { Relationship } from '../generated/relationship';
import ForceAtlas2 from "graphology-layout-forceatlas2";
import { runGrpcClient } from './grpc_client';


function addRelationToGraph(relationship: Relationship, graph: Graph) {
  if (!graph.hasDirectedEdge(relationship.label)) {
    if (!graph.hasNode(relationship.nodeFrom))
      graph.addNode(relationship.nodeFrom, { label: relationship.nodeFrom, size: 10, x: Math.random(), y: Math.random(), color: 'blue' })
    if (!graph.hasNode(relationship.nodeTo))
      graph.addNode(relationship.nodeTo, { label: relationship.nodeTo, size: 10, x: Math.random(), y: Math.random(), color: 'blue' })
    graph.addDirectedEdgeWithKey(relationship.label, relationship.nodeFrom, relationship.nodeTo, { label: relationship.label, size: 3, color: 'green', props: relationship.props })
  } else {
    console.log('Edge already added: ', relationship.label)
  }
}

let rel1: Relationship = { label: "rel1", nodeFrom: "x1", nodeTo: "x2", props: { "key1": "value1" } };
let rel2: Relationship = { label: "rel2", nodeFrom: "x2", nodeTo: "x3", props: { "key2": "value2" } };
let rel3: Relationship = { label: "rel3", nodeFrom: "x3", nodeTo: "x1", props: { "key3": "value3" } };

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sigma-container');

  if (!container) {
    console.error('Element with ID "sigma-container" not found.');
    return;
  }

  const nodeInfoPanel = document.getElementById('node-info');

  if (!nodeInfoPanel) {
    console.error('Element with ID "sigma-container" not found.');
    return;
  }

  const graph = new MultiDirectedGraph();

  addRelationToGraph(rel1, graph)
  addRelationToGraph(rel2, graph)
  addRelationToGraph(rel3, graph)

  let hoveredEdge: null | string = null;

  const renderer = new Sigma(graph, container, {
    renderEdgeLabels: true,
    enableEdgeEvents: true,
    edgeReducer(edge, data) {
      const res = { ...data };
      if (edge === hoveredEdge) res.color = "red";
      return res;
    },
  });

  ForceAtlas2.assign(graph, { iterations: 100 });

  renderer.refresh()

  renderer.on("enterEdge", ({ edge }) => {
    hoveredEdge = edge;
    renderer.refresh();
  });

  renderer.on("leaveEdge", ({ edge }) => {
    hoveredEdge = null;
    renderer.refresh();
  });

  renderer.on('enterEdge', ({ edge }) => {
    console.log(`Mouse over arco: ${edge}`);
    graph.setEdgeAttribute(edge, 'size', graph.getEdgeAttribute(edge, 'size') * 1.5);
  });

  renderer.on('leaveEdge', ({ edge }) => {
    console.log(`Mouse leave arco: ${edge}`);
    graph.setEdgeAttribute(edge, 'size', graph.getEdgeAttribute(edge, 'size') / 1.5);
  });

  renderer.on('clickEdge', (event) => {
    const edge = event.edge;
    const edgeAttributes = graph.getEdgeAttributes(edge);
    const edgeProps = edgeAttributes.props

    let infoHTML = `<h3>Proprietà dell'arco: ${edgeProps.label || edge}</h3>`;
    infoHTML += `<ul>`;

    for (const key in edgeProps) {
      infoHTML += `<li>${key}: ${edgeProps[key]}</li>`;
    }
    infoHTML += `</ul>`;

    nodeInfoPanel.innerHTML = infoHTML;
  });

  renderer.on('doubleClickNode', ({ event, node }) => {

    // avoids zoom-in
    event.preventSigmaDefault();

    console.log(`Mouse double click nodo: ${node}`);

    runGrpcClient(node)
      .subscribe({
        next: (relationship: Relationship) => {
          console.log("Relazione ricevuta:", relationship);
          addRelationToGraph(relationship, graph)
        },
        error: (err: Error) => {
          console.error("Errore nello stream gRPC-Web:", err);
          console.log(`Error: ${err.message || "Unknown error"}`);
        },
        complete: () => {
          console.log("Stream gRPC-Web completato.");
          console.log("Stream completed.");

          renderer.getCamera().animatedReset();
        },
      })
  });

  let draggedNode: string | null = null;
  let isDragging = false;

  renderer.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
    if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
  });

  renderer.on("moveBody", ({ event }) => {
    if (!isDragging || !draggedNode) return;

    const pos = renderer.viewportToGraph(event);

    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    event.preventSigmaDefault();
    event.original.preventDefault();
    event.original.stopPropagation();
  });

  const handleUp = () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  };
  renderer.on("upNode", handleUp);
  renderer.on("upStage", handleUp);

  renderer.on("clickStage", ({ event }: { event: { x: number; y: number } }) => {
    // Sigma (ie. graph) and screen (viewport) coordinates are not the same.
    // So we need to translate the screen x & y coordinates to the graph one by calling the sigma helper `viewportToGraph`
    const coordForGraph = renderer.viewportToGraph({ x: event.x, y: event.y });
  });

  console.log('Sigma.js initialized successfully!');
});
