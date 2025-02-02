import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'
import type { CompareOptions } from './compare'

import { getGroupNumber } from './get-group-number'
import { sortNodes } from './sort-nodes'

interface ExtraOptions<T extends SortingNode> {
  /**
   * If not provided, `options` will be used. If function returns null, nodes
   * will not be sorted within the group.
   */
  getGroupCompareOptions?(groupNumber: number): CompareOptions<T> | null
  ignoreEslintDisabledNodes: boolean
  isNodeIgnored?(node: T): boolean
}

interface GroupsOption {
  groups: GroupsOptions<string>
}

export let sortNodesByGroups = <T extends SortingNode>(
  nodes: T[],
  options: CompareOptions<T> & GroupsOption,
  extraOptions?: ExtraOptions<T>,
): T[] => {
  let nodesByNonIgnoredGroupNumber: Record<number, T[]> = {}
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled &&
        extraOptions?.ignoreEslintDisabledNodes) ||
      extraOptions?.isNodeIgnored?.(sortingNode)
    ) {
      ignoredNodeIndices.push(index)
      continue
    }
    let groupNumber = getGroupNumber(options.groups, sortingNode)
    nodesByNonIgnoredGroupNumber[groupNumber] ??= []
    nodesByNonIgnoredGroupNumber[groupNumber].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let compareOptions = extraOptions?.getGroupCompareOptions
      ? extraOptions.getGroupCompareOptions(Number(groupNumber))
      : options
    let nodesToPush = nodesByNonIgnoredGroupNumber[Number(groupNumber)]!
    if (!compareOptions) {
      sortedNodes.push(...nodesToPush)
      continue
    }
    sortedNodes.push(...sortNodes(nodesToPush, compareOptions))
  }

  // Add ignored nodes at the same position as they were before linting.
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
