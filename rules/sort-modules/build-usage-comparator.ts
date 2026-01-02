import type { TSESTree } from '@typescript-eslint/types'

import type { Comparator } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, SortModulesOptions } from './types'

import { isNodeDependentOnOtherNode } from '../../utils/is-node-dependent-on-other-node'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'
import { computeDependencies } from './compute-dependencies'

type SortingNodeWithDependencies = Pick<
  SortModulesSortingNode,
  'dependencyNames' | 'dependencies' | 'node'
>

/**
 * Builds a comparator function for sorting module nodes based on their usage.
 *
 * @param params - The parameters object.
 * @param params.ignoreEslintDisabledNodes - Whether to ignore ESLint disabled
 *   nodes.
 * @param params.sortingNodes - The module sorting nodes.
 * @param params.options - The sorting options.
 * @returns A comparator function for sorting module nodes by usage.
 */
export function buildUsageComparator({
  ignoreEslintDisabledNodes,
  sortingNodes,
  options,
}: {
  options: Required<SortModulesOptions[number]>
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): Comparator<SortModulesSortingNode> {
  let { updatedSortingNodeByNode, orderByUnsortedNode, orderBySortedNode } =
    buildOrderByNodeMaps({
      ignoreEslintDisabledNodes,
      sortingNodes,
    })
  return (a, b) => {
    let nodeA = a.node
    let nodeB = b.node

    let sortedOrderA = orderBySortedNode.get(nodeA)!
    let unsortedOrderA = orderByUnsortedNode.get(nodeA)!
    let sortedOrderB = orderBySortedNode.get(nodeB)!
    let unsortedOrderB = orderByUnsortedNode.get(nodeB)!

    let sortedOrderedValue = computeOrderedValue(
      sortedOrderA - sortedOrderB,
      options.order,
    )
    let unsortedOrderedValue = computeOrderedValue(
      unsortedOrderA - unsortedOrderB,
      options.order,
    )

    if (sortedOrderedValue !== unsortedOrderedValue) {
      return sortedOrderedValue
    }

    let aWithUpdatedDependencies = updatedSortingNodeByNode.get(nodeA)!
    let bWithUpdatedDependencies = updatedSortingNodeByNode.get(nodeB)!
    if (
      isNodeDependentOnOtherNode(
        aWithUpdatedDependencies,
        bWithUpdatedDependencies,
      ) ||
      isNodeDependentOnOtherNode(
        bWithUpdatedDependencies,
        aWithUpdatedDependencies,
      )
    ) {
      return sortedOrderedValue
    }

    return 0
  }
}

function buildOrderByNodeMaps({
  ignoreEslintDisabledNodes,
  sortingNodes,
}: {
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): {
  updatedSortingNodeByNode: Map<
    TSESTree.ProgramStatement,
    SortingNodeWithDependencies
  >
  orderByUnsortedNode: Map<TSESTree.ProgramStatement, number>
  orderBySortedNode: Map<TSESTree.ProgramStatement, number>
} {
  let sortingNodesWithUpdatedDependencies = sortingNodes.map(
    ({ isEslintDisabled, dependencyNames, node }) => ({
      dependencies: computeDependencies(node, { type: 'soft' }),
      isEslintDisabled,
      dependencyNames,
      node,
    }),
  )
  let sortedSortingNodes = sortNodesByDependencies(
    sortingNodesWithUpdatedDependencies,
    { ignoreEslintDisabledNodes },
  )

  return {
    updatedSortingNodeByNode: buildUpdatedSortingNodeByNodeMap(
      sortingNodesWithUpdatedDependencies,
    ),
    orderBySortedNode: buildOrderByNodeMap(sortedSortingNodes),
    orderByUnsortedNode: buildOrderByNodeMap(sortingNodes),
  }
}

function buildUpdatedSortingNodeByNodeMap(
  sortModulesSortingNodes: Pick<
    SortModulesSortingNode,
    'dependencyNames' | 'dependencies' | 'node'
  >[],
): Map<TSESTree.ProgramStatement, SortingNodeWithDependencies> {
  let returnValue = new Map<
    TSESTree.ProgramStatement,
    SortingNodeWithDependencies
  >()
  for (let sortingNode of sortModulesSortingNodes) {
    returnValue.set(sortingNode.node, sortingNode)
  }
  return returnValue
}

function buildOrderByNodeMap(
  sortModulesSortingNodes: SortingNodeWithDependencies[],
): Map<TSESTree.ProgramStatement, number> {
  let returnValue = new Map<TSESTree.ProgramStatement, number>()
  for (let [i, { node }] of sortModulesSortingNodes.entries()) {
    returnValue.set(node, i)
  }
  return returnValue
}
