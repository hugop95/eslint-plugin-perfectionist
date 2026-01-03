import type { TSESTree } from '@typescript-eslint/types'

export function buildSortingNodeByNode<T extends { node: TSESTree.Node }>(
  sortingNodes: T[],
): Map<T['node'], T> {
  let sortingNodeByNode = new Map<T['node'], T>()
  for (let sortingNode of sortingNodes) {
    sortingNodeByNode.set(sortingNode.node, sortingNode)
  }
  return sortingNodeByNode
}
