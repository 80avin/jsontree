import { create } from "zustand";
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { CanvasDirection } from "reaflow/dist/layout/elkLayout";
import { getChildrenEdges } from "@/core/graph/getChildrenEdges";
import { getOutgoers } from "@/core/graph/getOutgoers";
import { parser } from "@/core/json/jsonParser";
import { useJson } from "@/store//useJson";
import { EdgeData, NodeData } from "@/core/type";
import { compressToEncodedURIComponent } from "lz-string";

// Helper function to update URL with current settings
const updateUrlWithSettings = async () => {
  try {
    const { createShareableUrl } = await import("@/store/useSavedJsons");
    const enhancedUrl = await createShareableUrl(true);
    window.history.replaceState({}, "", enhancedUrl);
  } catch (error) {
    // Silently fail - URL update is not critical
    // eslint-disable-next-line no-console
    console.warn("Failed to update URL with settings:", error);
  }
};

const initialStates = {
  zoomPanPinch: null as ReactZoomPanPinchRef | null,
  direction: "RIGHT" as CanvasDirection,
  loading: true,
  graphCollapsed: false,
  foldNodes: false,
  fullscreen: false,
  nodes: [] as NodeData[],
  edges: [] as EdgeData[],
  collapsedNodes: [] as string[],
  collapsedEdges: [] as string[],
  collapsedParents: [] as string[],
  selectedNode: {} as NodeData,
  path: "",
};

export type Graph = typeof initialStates;

interface GraphActions {
  setGraph: (json?: string, options?: Partial<Graph>[]) => void;
  setLoading: (loading: boolean) => void;
  setDirection: (direction: CanvasDirection) => void;
  setZoomPanPinch: (ref: ReactZoomPanPinchRef) => void;
  setSelectedNode: (nodeData: NodeData) => void;
  expandNodes: (nodeId: string) => void;
  expandGraph: () => void;
  collapseNodes: (nodeId: string) => void;
  collapseGraph: () => void;
  toggleFold: (value: boolean) => void;
  toggleFullscreen: (value: boolean) => void;
  share: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerView: () => void;
  clearGraph: () => void;
}

export const useTree = create<Graph & GraphActions>((set, get) => ({
  ...initialStates,
  clearGraph: () => set({ nodes: [], edges: [], loading: false }),
  setSelectedNode: (nodeData) => set({ selectedNode: nodeData }),
  setGraph: (data, options) => {
    const { nodes, edges } = parser(data ?? useJson.getState().json);
    set({
      nodes,
      edges,
      collapsedParents: [],
      collapsedNodes: [],
      collapsedEdges: [],
      graphCollapsed: false,
      loading: true,
      ...options,
    });
  },
  setDirection: (direction = "RIGHT") => {
    set({ direction });
    setTimeout(() => get().centerView(), 200);
    // Update URL with new direction setting
    updateUrlWithSettings();
  },
  setLoading: (loading) => set({ loading }),
  expandNodes: (nodeId) => {
    const [childrenNodes, matchingNodes] = getOutgoers(
      nodeId,
      get().nodes,
      get().edges,
      get().collapsedParents,
    );
    const childrenEdges = getChildrenEdges(childrenNodes, get().edges);

    let nodesConnectedToParent = childrenEdges.reduce(
      (nodes: string[], edge) => {
        edge.from && !nodes.includes(edge.from) && nodes.push(edge.from);
        edge.to && !nodes.includes(edge.to) && nodes.push(edge.to);
        return nodes;
      },
      [],
    );
    const matchingNodesConnectedToParent = matchingNodes.filter((node) =>
      nodesConnectedToParent.includes(node),
    );
    const nodeIds = childrenNodes
      .map((node) => node.id)
      .concat(matchingNodesConnectedToParent);
    const edgeIds = childrenEdges.map((edge) => edge.id);

    const collapsedParents = get().collapsedParents.filter(
      (cp) => cp !== nodeId,
    );
    const collapsedNodes = get().collapsedNodes.filter(
      (nodeId) => !nodeIds.includes(nodeId),
    );
    const collapsedEdges = get().collapsedEdges.filter(
      (edgeId) => !edgeIds.includes(edgeId),
    );

    set({
      collapsedParents,
      collapsedNodes,
      collapsedEdges,
      graphCollapsed: !!collapsedNodes.length,
    });
  },
  collapseNodes: (nodeId) => {
    const [childrenNodes] = getOutgoers(nodeId, get().nodes, get().edges);
    const childrenEdges = getChildrenEdges(childrenNodes, get().edges);

    const nodeIds = childrenNodes.map((node) => node.id);
    const edgeIds = childrenEdges.map((edge) => edge.id);

    set({
      collapsedParents: get().collapsedParents.concat(nodeId),
      collapsedNodes: get().collapsedNodes.concat(nodeIds),
      collapsedEdges: get().collapsedEdges.concat(edgeIds),
      graphCollapsed: !!get().collapsedNodes.concat(nodeIds).length,
    });
  },
  collapseGraph: () => {
    const edges = get().edges;
    const tos = edges.map((edge) => edge.to);
    const froms = edges.map((edge) => edge.from);
    const parentNodesIds = froms.filter((id) => !tos.includes(id));
    const secondDegreeNodesIds = edges
      .filter((edge) => parentNodesIds.includes(edge.from))
      .map((edge) => edge.to);

    const collapsedParents = get()
      .nodes.filter(
        (node) => !parentNodesIds.includes(node.id) && node.data.isParent,
      )
      .map((node) => node.id);

    const collapsedNodes = get()
      .nodes.filter(
        (node) =>
          !parentNodesIds.includes(node.id) &&
          !secondDegreeNodesIds.includes(node.id),
      )
      .map((node) => node.id);

    set({
      collapsedParents,
      collapsedNodes,
      collapsedEdges: get()
        .edges.filter((edge) => !parentNodesIds.includes(edge.from))
        .map((edge) => edge.id),
      graphCollapsed: true,
    });
  },
  expandGraph: () => {
    set({
      collapsedNodes: [],
      collapsedEdges: [],
      collapsedParents: [],
      graphCollapsed: false,
    });
  },
  share: async () => {
    try {
      const { createShareableUrl } = await import("@/store/useSavedJsons");
      const url = await createShareableUrl(true);
      await navigator.clipboard.writeText(url);
      alert("URL with settings copied to clipboard!");
    } catch (err) {
      // Fallback to old sharing method
      const url = new URL(window.location.href);
      const json = useJson.getState().json;
      url.hash = "#" + compressToEncodedURIComponent(json);
      await navigator.clipboard
        .writeText(url.toString())
        .then(() => {
          alert("URL copied to clipboard");
        })
        .catch((error) => {
          alert("Failed to copy URL to clipboard");
          // eslint-disable-next-line no-console
          console.error(error);
        });
    }
  },
  zoomIn: () => {
    const zoomPanPinch = get().zoomPanPinch;
    zoomPanPinch?.setTransform(
      zoomPanPinch?.state.positionX,
      zoomPanPinch?.state.positionY,
      zoomPanPinch?.state.scale + 0.4,
    );
  },
  zoomOut: () => {
    const zoomPanPinch = get().zoomPanPinch;
    zoomPanPinch?.setTransform(
      zoomPanPinch?.state.positionX,
      zoomPanPinch?.state.positionY,
      zoomPanPinch?.state.scale - 0.4,
    );
  },
  centerView: () => {
    const zoomPanPinch = get().zoomPanPinch;
    const canvas = document.querySelector(".jsontree-canvas") as HTMLElement;
    if (zoomPanPinch && canvas) zoomPanPinch.zoomToElement(canvas);
  },
  toggleFold: (foldNodes) => {
    set({ foldNodes });
    get().setGraph();
    // Update URL with new fold setting
    updateUrlWithSettings();
  },
  toggleFullscreen: (fullscreen) => set({ fullscreen }),
  setZoomPanPinch: (zoomPanPinch) => set({ zoomPanPinch }),
}));
