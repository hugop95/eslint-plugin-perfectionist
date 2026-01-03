import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortModulesSortingNode,
  SortModulesOptions,
  SortModulesNode,
} from './types'
import type { Comparator } from '../../utils/compare/default-comparator-by-options-computer'

import { computeSortingNodeDependencies } from '../../utils/compute-sorting-node-dependencies'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'
import { buildSortingNodeByNode } from '../../utils/build-sorting-node-by-node'
import { computeDependenciesByNode } from './compute-dependencies-by-node'

export function buildUsageComparator({
  ignoreEslintDisabledNodes,
  sortingNodes,
  sourceCode,
  options,
}: {
  options: Required<SortModulesOptions[number]>
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): Comparator<SortModulesSortingNode> {
  let orderByNode = buildOrderByNodeMap({
    ignoreEslintDisabledNodes,
    sortingNodes,
    sourceCode,
  })
  return (a, b) => {
    let nodeA = a.node
    let nodeB = b.node

    let orderA = orderByNode.get(nodeA)!
    let orderB = orderByNode.get(nodeB)!

    return computeOrderedValue(orderA - orderB, options.order)
  }
}

function buildOrderByNodeMap({
  ignoreEslintDisabledNodes,
  sortingNodes,
  sourceCode,
}: {
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): Map<SortModulesNode, number> {
  let dependenciesByNode = computeDependenciesByNode({
    dependencyDetection: 'soft',
    sortingNodes,
    sourceCode,
  })
  let sortingNodeByNode = buildSortingNodeByNode(sortingNodes)

  let sortingNodesWithUpdatedDependencies = sortingNodes.map(
    ({ isEslintDisabled, dependencyNames, node }) => ({
      dependencies: computeSortingNodeDependencies({
        dependenciesByNode,
        sortingNodeByNode,
        node,
      }),
      isEslintDisabled,
      dependencyNames,
      node,
    }),
  )
  let sortedSortingNodes = sortNodesByDependencies(
    sortingNodesWithUpdatedDependencies,
    { ignoreEslintDisabledNodes },
  )

  let orderByNodeMap = new Map<SortModulesNode, number>()
  for (let [i, { node }] of sortedSortingNodes.entries()) {
    orderByNodeMap.set(node, i)
  }

  return orderByNodeMap
}
