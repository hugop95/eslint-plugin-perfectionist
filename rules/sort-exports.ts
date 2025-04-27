import type { TSESTree } from '@typescript-eslint/types'

import type { Modifier, Selector, Options } from './sort-exports/types'
import type { SortingNode } from '../types/sorting-node'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { ALL_MODIFIERS, ALL_SELECTORS } from './sort-exports/types'
import { singleCustomGroupJsonSchema } from './sort-exports/types'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
const CACHED_GROUPS_BY_MODIFIERS_AND_SELECTORS = new Map<string, string[]>()

interface SortExportsSortingNode
  extends SortingNode<
    TSESTree.ExportNamedDeclarationWithSource | TSESTree.ExportAllDeclaration
  > {
  groupKind: 'value' | 'type'
}

type MESSAGE_ID =
  | 'unexpectedExportsGroupOrder'
  | 'missedSpacingBetweenExports'
  | 'extraSpacingBetweenExports'
  | 'unexpectedExportsOrder'

const DEFAULT_OPTIONS: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  partitionByComment: false,
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  type: 'alphabetical',
  groupKind: 'mixed',
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, DEFAULT_OPTIONS)
    validateCustomSortConfiguration(options)
    validateGeneratedGroupsConfiguration({
      modifiers: ALL_MODIFIERS,
      selectors: ALL_SELECTORS,
      options,
    })
    validateNewlinesAndPartitionConfiguration(options)

    let { sourceCode, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })

    let formattedMembers: SortExportsSortingNode[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ): void => {
      let selector: Selector = 'export'
      let modifiers: Modifier[] = []
      if (node.exportKind === 'value') {
        modifiers.push('value')
      } else {
        modifiers.push('type')
      }

      let name = node.source.value

      let predefinedGroups = generatePredefinedGroups({
        cache: CACHED_GROUPS_BY_MODIFIERS_AND_SELECTORS,
        selectors: [selector],
        modifiers,
      })
      let group = computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            selectors: [selector],
            elementName: name,
            customGroup,
            modifiers,
          }),
        predefinedGroups,
        options,
      })

      let sortingNode: SortExportsSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        groupKind: node.exportKind === 'value' ? 'value' : 'type',
        size: rangeToDiff(node, sourceCode),
        addSafetySemicolonWhenInline: true,
        group,
        name,
        node,
      }
      let lastNode = formattedMembers.at(-1)?.at(-1)

      if (
        shouldPartition({
          lastSortingNode: lastNode,
          sortingNode,
          sourceCode,
          options,
        })
      ) {
        formattedMembers.push([])
      }

      formattedMembers.at(-1)!.push(sortingNode)
    }

    return {
      'Program:exit': () => {
        let groupKindOrder
        if (options.groupKind === 'values-first') {
          groupKindOrder = ['value', 'type'] as const
        } else if (options.groupKind === 'types-first') {
          groupKindOrder = ['type', 'value'] as const
        } else {
          groupKindOrder = ['any'] as const
        }

        for (let nodes of formattedMembers) {
          let filteredGroupKindNodes = groupKindOrder.map(groupKind =>
            nodes.filter(
              currentNode =>
                groupKind === 'any' || currentNode.groupKind === groupKind,
            ),
          )
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortExportsSortingNode[] =>
            filteredGroupKindNodes.flatMap(groupedNodes =>
              sortNodesByGroups({
                getOptionsByGroupNumber:
                  buildGetCustomGroupOverriddenOptionsFunction(options),
                ignoreEslintDisabledNodes,
                groups: options.groups,
                nodes: groupedNodes,
              }),
            )

          reportAllErrors<MESSAGE_ID>({
            availableMessageIds: {
              missedSpacingBetweenMembers: 'missedSpacingBetweenExports',
              extraSpacingBetweenMembers: 'extraSpacingBetweenExports',
              unexpectedGroupOrder: 'unexpectedExportsGroupOrder',
              unexpectedOrder: 'unexpectedExportsOrder',
            },
            sortNodesExcludingEslintDisabled,
            sourceCode,
            options,
            context,
            nodes,
          })
        }
      },
      ExportNamedDeclaration: node => {
        if (node.source !== null) {
          registerNode(node)
        }
      },
      ExportAllDeclaration: registerNode,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          groupKind: {
            description: '[DEPRECATED] Specifies top-level groups.',
            enum: ['mixed', 'values-first', 'types-first'],
            type: 'string',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      missedSpacingBetweenExports: MISSED_SPACING_ERROR,
      extraSpacingBetweenExports: EXTRA_SPACING_ERROR,
      unexpectedExportsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedExportsOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-exports',
      description: 'Enforce sorted exports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [DEFAULT_OPTIONS],
  name: 'sort-exports',
})
