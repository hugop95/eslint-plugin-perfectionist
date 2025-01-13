import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'
import type { SortingNodeWithGroup } from './sort-nodes-by-groups'

import { getNewlinesErrors } from './get-newlines-errors'
import { getGroupNumber } from './get-group-number'

interface GetOrderWithDependenciesErrors<MessageIds extends string> {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedDependencyOrder: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  options: {
    groups: (
      | { newlinesBetween: 'ignore' | 'always' | 'never' }
      | string[]
      | string
    )[]
    newlinesBetween: 'ignore' | 'always' | 'never'
  }
  firstUnorderedNodeDependentOnRight:
    | SortingNodeWithGroupAndDependencies
    | undefined
  sortedNodesExcludingEslintDisabled: SortingNodeWithGroupAndDependencies[]
  nodeIndexMap: Map<SortingNodeWithGroupAndDependencies, number>
  right: SortingNodeWithGroupAndDependencies
  left: SortingNodeWithGroupAndDependencies
  sourceCode: TSESLint.SourceCode
}

type SortingNodeWithGroupAndDependencies = SortingNodeWithDependencies &
  SortingNodeWithGroup

export let getOrderWithDependenciesErrors = <MessageIds extends string>({
  sortedNodesExcludingEslintDisabled,
  firstUnorderedNodeDependentOnRight,
  availableMessageIds,
  nodeIndexMap,
  sourceCode,
  options,
  right,
  left,
}: GetOrderWithDependenciesErrors<MessageIds>): MessageIds[] => {
  let leftNumber = getGroupNumber(options.groups, left)
  let rightNumber = getGroupNumber(options.groups, right)

  let leftIndex = nodeIndexMap.get(left)!
  let rightIndex = nodeIndexMap.get(right)!

  let indexOfRightExcludingEslintDisabled =
    sortedNodesExcludingEslintDisabled.indexOf(right)

  let messageIds: MessageIds[] = []

  if (firstUnorderedNodeDependentOnRight) {
    messageIds.push(availableMessageIds.unexpectedDependencyOrder)
  } else if (
    leftIndex > rightIndex ||
    leftIndex >= indexOfRightExcludingEslintDisabled
  ) {
    messageIds.push(
      leftNumber === rightNumber
        ? availableMessageIds.unexpectedOrder
        : availableMessageIds.unexpectedGroupOrder,
    )
  }

  return [
    ...messageIds,
    ...getNewlinesErrors({
      missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
      extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
      rightNum: rightNumber,
      leftNum: leftNumber,
      sourceCode,
      options,
      right,
      left,
    }),
  ]
}
