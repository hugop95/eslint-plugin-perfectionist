import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

type WithDependencies<T> = {
  dependencies: string[]
} & T

export function computeSortingNodeGroupsWithDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  sortingNodeGroupsWithoutDependencies,
  dependenciesBySortingNode,
}: {
  sortingNodeGroupsWithoutDependencies: T[][]
  dependenciesBySortingNode: Map<T, T[]>
}): WithDependencies<T>[][] {
  return sortingNodeGroupsWithoutDependencies.map(sortingNodes =>
    computeSortingNodeGroupWithDependencies({
      dependenciesBySortingNode,
      sortingNodes,
    }),
  )
}

function computeSortingNodeGroupWithDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  dependenciesBySortingNode,
  sortingNodes,
}: {
  dependenciesBySortingNode: Map<T, T[]>
  sortingNodes: T[]
}): WithDependencies<T>[] {
  return sortingNodes.map(computeSortingNodeWithDependencies)

  function computeSortingNodeWithDependencies(
    sortingNode: T,
  ): WithDependencies<T> {
    return {
      ...sortingNode,
      dependencies: computeSortingNodeDependencies({
        dependenciesBySortingNode,
        sortingNode,
      }),
    }
  }
}

function computeSortingNodeDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  dependenciesBySortingNode,
  sortingNode,
}: {
  dependenciesBySortingNode: Map<T, T[]>
  sortingNode: T
}): string[] {
  let dependencies = dependenciesBySortingNode.get(sortingNode)
  if (!dependencies) {
    return []
  }

  return dependencies.flatMap(({ dependencyNames }) => dependencyNames)
}
