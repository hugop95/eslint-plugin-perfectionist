import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

export function computeSortingNodeDependencies<Node extends TSESTree.Node>({
  dependenciesByNode,
  sortingNodeByNode,
  node,
}: {
  sortingNodeByNode: Map<
    Node,
    Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>
  >
  dependenciesByNode: Map<Node, Node[]>
  node: Node
}): string[] {
  let dependencies = dependenciesByNode.get(node)
  if (!dependencies) {
    return []
  }

  return dependencies
    .map(findSortingNodeByNode)
    .flatMap(({ dependencyNames }) => dependencyNames)

  function findSortingNodeByNode(
    nodeToSearch: Node,
  ): Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'> {
    return sortingNodeByNode.get(nodeToSearch)!
  }
}
