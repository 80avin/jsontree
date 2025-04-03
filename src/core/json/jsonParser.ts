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
    const text_all_compressed = node.text.map(([key, val]): [string, any] => {
      if (!(val instanceof Object)) return [key, val];
      return [
        key,
        {
          [Array.isArray(val) ? "array" : "object"]: Array.isArray(val)
            ? val.length
            : Object.keys(val).length,
        },
      ];
    });
    const hasParent = node.path?.startsWith("{Root}.") ?? false;
    const width_no_object = calculateNodeSize(
      text_all_compressed,
      hasParent,
    ).width;
    const newWidth = Math.max(200, width_no_object);
    node.text = node.text.map((text, i) => {
      if (!(text[1] instanceof Object)) {
        return text;
      }
      const obj_width = calculateNodeSize([text], hasParent).width;
      if (obj_width > newWidth) {
        return text_all_compressed[i];
      }
      pathsToRemove.push(`${node.path}.${text[0]}`);

      return text;
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
  const stack: [number, string, Node][] = [[-1, "{Root}", tree]];
  const visitNode = (node: Node, parentId: number, key: string): number => {
    const id = graph.nodes.length;
    if (node.type === "object") {
      const text: [string, any][] = node.children!.map((child) => [
        child.children![0].value,
        ["object", "array"].includes(child.children![1].type)
          ? getNodeValue(child.children![1])
          : child.children![1].value,
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

      if (parentId !== -1) {
        graph.edges.push({
          id: `e${parentId}-${id}`,
          from: `${parentId}`,
          to: `${id}`,
        });
      }
    } else if (node.type === "array") {
      // add array as prop ?
      // do nothing ?
    } else if (node.type === "property") {
      const propId = graph.nodes.length;
      graph.nodes.push({
        id: `${graph.nodes.length}`,
        text: node.children![0].value,
        data: {
          childrenCount:
            node.children![1].type === "object"
              ? 1
              : node.children![1].children!.length,
          isParent: true,
          isEmpty: false,
          type: node.children![1].type,
        },
        path: `${graph.nodes[parentId].path}.${node.children![0].value}`,
        ...calculateNodeSize(node.children![0].value, true),
      });
      graph.edges.push({
        id: `e${parentId}-${propId}`,
        from: `${parentId}`,
        to: `${propId}`,
      });
    } else {
      graph.nodes.push({
        id: `${id}`,
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
          id: `e${parentId}-${id}`,
          from: `${parentId}`,
          to: `${id}`,
        });
      }
    }
    return id;
  };
  while (stack.length) {
    const [parentId, key, node] = stack.shift()!;
    const myId = visitNode(node, parentId, key);
    if (node.type === "object") {
      stack.unshift(
        ...node
          .children!.filter((propChild) =>
            ["array", "object"].includes(propChild.children![1].type),
          )
          .map(
            (propChild) =>
              [myId, propChild.children![0].value as string, propChild] as [
                number,
                string,
                Node,
              ],
          ),
      );
    } else if (node.type === "array") {
      stack.unshift(
        ...node.children!.map(
          (child, i) =>
            [parentId, key ? `${key}.${i}` : `${i}`, child] as [
              number,
              string,
              Node,
            ],
        ),
      );
    } else if (node.type === "property") {
      stack.unshift([myId, node.children![0].value, node.children![1]]);
    }
  }

  compressGraph(graph);
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
