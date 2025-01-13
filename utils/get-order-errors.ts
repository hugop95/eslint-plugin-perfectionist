import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithGroup } from './sort-nodes-by-groups'

import { getNewlinesErrors } from './get-newlines-errors'
import { getGroupNumber } from './get-group-number'

interface GetOrderErrors<MessageIds extends string> {
  availableMessageIds: {
    missedSpacingBetweenMembers?: MessageIds
    extraSpacingBetweenMembers?: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  options: {
    groups: (
      | { newlinesBetween: 'ignore' | 'always' | 'never' }
      | string[]
      | string
    )[]
    newlinesBetween?: 'ignore' | 'always' | 'never'
  }
  sortedNodesExcludingEslintDisabled: SortingNodeWithGroup[]
  nodeIndexMap: Map<SortingNodeWithGroup, number>
  sourceCode: TSESLint.SourceCode
  right: SortingNodeWithGroup
  left: SortingNodeWithGroup
}

export let getOrderErrors = <MessageIds extends string>({
  sortedNodesExcludingEslintDisabled,
  availableMessageIds,
  nodeIndexMap,
  sourceCode,
  options,
  right,
  left,
}: GetOrderErrors<MessageIds>): MessageIds[] => {
  let leftNumber = getGroupNumber(options.groups, left)
  let rightNumber = getGroupNumber(options.groups, right)

  let leftIndex = nodeIndexMap.get(left)!
  let rightIndex = nodeIndexMap.get(right)!

  let indexOfRightExcludingEslintDisabled =
    sortedNodesExcludingEslintDisabled.indexOf(right)

  let messageIds: MessageIds[] = []

  if (
    leftIndex > rightIndex ||
    leftIndex >= indexOfRightExcludingEslintDisabled
  ) {
    messageIds.push(
      leftNumber === rightNumber
        ? availableMessageIds.unexpectedOrder
        : availableMessageIds.unexpectedGroupOrder,
    )
  }

  if (
    !options.newlinesBetween ||
    !availableMessageIds.missedSpacingBetweenMembers ||
    !availableMessageIds.extraSpacingBetweenMembers
  ) {
    return messageIds
  }

  return [
    ...messageIds,
    ...getNewlinesErrors({
      options: {
        ...options,
        newlinesBetween: options.newlinesBetween,
      },
      missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
      extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
      rightNum: rightNumber,
      leftNum: leftNumber,
      sourceCode,
      right,
      left,
    }),
  ]
}
