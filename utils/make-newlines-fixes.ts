import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'
import { getNodeRange } from './get-node-range'

interface CustomGroup {
  newlinesInside?: 'ignore' | 'always' | 'never'
  newlinesAbove?: 'ignore' | 'always' | 'never'
  newlinesBelow?: 'ignore' | 'always' | 'never'
  groupName: string
}

interface MakeNewlinesFixesParameters {
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
  options: Options
}

interface Options {
  customGroups?: Record<string, string[] | string> | CustomGroup[]
  newlinesBetween: 'ignore' | 'always' | 'never'
  groups: (string[] | string)[]
}

export let makeNewlinesFixes = ({
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeNewlinesFixesParameters): TSESLint.RuleFix[] => {
  let fixes: TSESLint.RuleFix[] = []

  for (let i = 0; i < sortedNodes.length - 1; i++) {
    let fix = getNewlineFix({
      nextSortedSortingNode: sortedNodes.at(i + 1)!,
      sortedSortingNode: sortedNodes.at(i)!,
      nextSortingNode: nodes.at(i + 1)!,
      sortingNode: nodes.at(i)!,
      sourceCode,
      options,
      fixer,
    })
    if (fix) {
      fixes.push(fix)
    }
  }

  return fixes
}

let getNewlineFix = ({
  nextSortedSortingNode,
  sortedSortingNode,
  nextSortingNode,
  sortingNode,
  sourceCode,
  options,
  fixer,
}: {
  nextSortedSortingNode: SortingNode
  sourceCode: TSESLint.SourceCode
  sortedSortingNode: SortingNode
  nextSortingNode: SortingNode
  fixer: TSESLint.RuleFixer
  sortingNode: SortingNode
  options: Options
}): TSESLint.RuleFix | null => {
  let newlinesBetween = getNewlinesBetweenOption({
    nextSortingNode: nextSortedSortingNode,
    sortingNode: sortedSortingNode,
    options,
  })

  if (newlinesBetween === 'ignore') {
    return null
  }

  let currentNodeRange = getNodeRange({
    node: sortingNode.node,
    sourceCode,
  })
  let nextNodeRangeStart = getNodeRange({
    node: nextSortingNode.node,
    sourceCode,
  }).at(0)!
  let rangeToReplace: [number, number] = [
    currentNodeRange.at(1)!,
    nextNodeRangeStart,
  ]
  let textBetweenNodes = sourceCode.text.slice(
    currentNodeRange.at(1),
    nextNodeRangeStart,
  )

  let linesBetweenMembers = getLinesBetween(
    sourceCode,
    sortingNode,
    nextSortingNode,
  )

  let rangeReplacement: undefined | string
  if (newlinesBetween === 'never' && linesBetweenMembers !== 0) {
    rangeReplacement = getStringWithoutInvalidNewlines(textBetweenNodes)
  }

  if (newlinesBetween === 'always' && linesBetweenMembers !== 1) {
    rangeReplacement = addNewlineBeforeFirstNewline(
      linesBetweenMembers > 1
        ? getStringWithoutInvalidNewlines(textBetweenNodes)
        : textBetweenNodes,
    )
    let isOnSameLine =
      linesBetweenMembers === 0 &&
      sortedSortingNode.node.loc.end.line ===
        nextSortedSortingNode.node.loc.start.line
    if (isOnSameLine) {
      rangeReplacement = addNewlineBeforeFirstNewline(rangeReplacement)
    }
  }

  if (!rangeReplacement) {
    return null
  }
  return fixer.replaceTextRange(rangeToReplace, rangeReplacement)
}

let getStringWithoutInvalidNewlines = (value: string): string =>
  value.replaceAll(/\n\s*\n/gu, '\n').replaceAll(/\n+/gu, '\n')

let addNewlineBeforeFirstNewline = (value: string): string => {
  let firstNewlineIndex = value.indexOf('\n')
  if (firstNewlineIndex === -1) {
    return `${value}\n`
  }
  return `${value.slice(0, firstNewlineIndex)}\n${value.slice(firstNewlineIndex)}`
}
