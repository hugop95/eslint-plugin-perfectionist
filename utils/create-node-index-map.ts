import type { SortingNode } from '../types/sorting-node'

export let createNodeIndexMap = <T extends SortingNode>(
  nodes: T[],
): Map<T, number> => {
  let nodeIndexMap = new Map<T, number>()
  for (let [index, node] of nodes.entries()) {
    nodeIndexMap.set(node, index)
  }
  return nodeIndexMap
}
