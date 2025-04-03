import { Node, parseTree, getNodeValue as _getNodeValue } from "jsonc-parser";
import { EdgeData, NodeData } from "@/core/type";
import { calculateNodeSize } from "../calculateNodeSize";

/**
 * computes node value, ensuring the objects have a prototype
 */
const getNodeValue = (v: any) => JSON.parse(JSON.stringify(_getNodeValue(v)));

export type Graph = {
  nodes: NodeData[];
  edges: EdgeData[];
};

function compressGraph(graph: Graph) {
  const pathsToRemove: string[] = [];
  for (const node of graph.nodes) {
    if (!Array.isArray(node.text)) {
      continue;
    }
    const text_no_object = node.text.filter(([_, v]) => !(v instanceof Object));
    const hasParent = node.path?.startsWith("{Root}.") ?? false;
    const width_no_object = calculateNodeSize(text_no_object, hasParent).width;
    const newWidth = Math.max(200, width_no_object);
    node.text = node.text.map(([key, val]) => {
      if (!(val instanceof Object)) {
        return [key, val];
      }
      const obj_width = calculateNodeSize([[key, val]], hasParent).width;
      if (obj_width > newWidth) {
        return [
          key,
          {
            [Array.isArray(val) ? "array" : "object"]: Array.isArray(val)
              ? val.length
              : Object.keys(val).length,
          },
        ];
      }
      pathsToRemove.push(`${node.path}.${key}`);

      return [key, val];
    });
    node.width = newWidth;
  }
  graph.nodes = graph.nodes.filter((node) => {
    const shouldRemove = pathsToRemove.some((pathPrefix) =>
      node.path!.startsWith(pathPrefix),
    );
    if (shouldRemove) {
      graph.edges = graph.edges.filter((e) => {
        return e.to !== node.id && e.from !== node.id;
      });
    }
    return !shouldRemove;
  });
}

function buildGraph(tree: Node): Graph {
  const graph: Graph = { nodes: [], edges: [] };
  const stack: Array<[number, string | null, Node]> = [[-1, "{Root}", tree]];
  while (stack.length) {
    const [parentId, key, node] = stack.shift()!;
    const curId = graph.nodes.length;
    if (node.type === "object") {
      const text: [string, any][] = node.children!.map((child) => [
        child.children![0].value,
        ["object", "array"].includes(child.children![1].type)
          ? getNodeValue(child.children![1])
          : // ? { [child.children![1].type]: child.children![1].children!.length }
            child.children![1].value,
      ]);
      graph.nodes.push({
        id: `${graph.nodes.length}`,
        text,
        data: {
          childrenCount: 0,
          isParent: false,
          isEmpty: !node.children!.length,
          type: "null",
        },
        path: (parentId === -1 ? "" : `${graph.nodes[parentId].path}.`) + key,
        ...calculateNodeSize(text, parentId !== -1),
      });
      node
        .children!.filter((child) =>
          ["array", "object"].includes(child.children![1].type),
        )
        .forEach((child) => {
          const propId = graph.nodes.length;
          graph.nodes.push({
            id: `${graph.nodes.length}`,
            text: child.children![0].value,
            data: {
              childrenCount:
                child.type === "object"
                  ? 1
                  : child.children![1].children!.length,
              isParent: true,
              isEmpty: false,
              type: child.children![1].type,
            },
            path: `${graph.nodes[curId].path}.${child.children![0].value}`,
            ...calculateNodeSize(child.children![0].value, true),
          });
          graph.edges.push({
            id: `e${curId}-${propId}`,
            from: `${curId}`,
            to: `${propId}`,
          });
          stack.push([propId, child.children![0].value, child.children![1]]);
        });
      if (parentId !== -1) {
        graph.edges.push({
          id: `e${parentId}-${curId}`,
          from: `${parentId}`,
          to: `${curId}`,
        });
      }
    } else if (node.type === "array") {
      node.children!.forEach((child, i) =>
        stack.push([parentId, key ? `${key}.${i}` : `${i}`, child]),
      );
    } else {
      graph.nodes.push({
        id: `${graph.nodes.length}`,
        text: node.value,
        data: {
          childrenCount: 0,
          isParent: false,
          isEmpty: false,
          type: node.type,
        },
        path:
          (parentId === -1 ? "" : `${graph.nodes[parentId].path}.`) +
          (key === null ? "{Root}" : key),
        ...calculateNodeSize(`${node.value}`, parentId !== -1),
      });
      if (parentId !== -1) {
        graph.edges.push({
          id: `e${parentId}-${curId}`,
          from: `${parentId}`,
          to: `${curId}`,
        });
      }
    }
  }

  compressGraph(graph);
  // We have built the graph in breadth-first order, but we want to sort it in depth-first order
  // otherwise, the edges intersect - probably bug in reaflow
  graph.nodes.sort((a, b) =>
    a.path && b.path ? b.path.split(".").length - a.path.split(".").length : -1,
  );
  return graph;
}

export function parser(jsonStr: string): Graph {
  try {
    const parsedJsonTree = parseTree(jsonStr);
    if (!parsedJsonTree) {
      throw new Error("Invalid document");
    }
    return buildGraph(parsedJsonTree);
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
    return { nodes: [], edges: [] };
  }
}
