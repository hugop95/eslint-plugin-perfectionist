import type {
  SortNamedImportsSortingNode,
  Modifier,
  Selector,
  Options,
} from './sort-named-imports/types'

import {
  PARTITION_BY_NEW_LINE_JSON_SCHEMA,
  buildCustomGroupsArrayJsonSchema,
  PARTITION_BY_COMMENT_JSON_SCHEMA,
  NEWLINES_BETWEEN_JSON_SCHEMA,
  COMMON_JSON_SCHEMAS,
  GROUPS_JSON_SCHEMA,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import {
  SINGLE_CUSTOM_GROUP_JSON_SCHEMA,
  ALL_MODIFIERS,
  ALL_SELECTORS,
} from './sort-named-imports/types'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

type MESSAGE_ID =
  | 'unexpectedNamedImportsGroupOrder'
  | 'missedSpacingBetweenNamedImports'
  | 'extraSpacingBetweenNamedImports'
  | 'unexpectedNamedImportsOrder'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
const CACHED_GROUPS_BY_MODIFIERS_AND_SELECTORS = new Map<string, string[]>()

const DEFAULT_OPTIONS: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  ignoreAlias: false,
  groupKind: 'mixed',
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )
      if (!isSortable(specifiers)) {
        return
      }

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

      let formattedMembers: SortNamedImportsSortingNode[][] = [[]]
      for (let specifier of specifiers) {
        let { name } = specifier.local

        if (specifier.type === 'ImportSpecifier' && options.ignoreAlias) {
          if (specifier.imported.type === 'Identifier') {
            ;({ name } = specifier.imported)
          } else {
            name = specifier.imported.value
          }
        }

        let selector: Selector = 'import'
        let modifiers: Modifier[] = []
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.importKind === 'type'
        ) {
          modifiers.push('type')
        } else {
          modifiers.push('value')
        }

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

        let sortingNode: SortNamedImportsSortingNode = {
          groupKind:
            specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type'
              ? 'type'
              : 'value',
          isEslintDisabled: isNodeEslintDisabled(
            specifier,
            eslintDisabledLines,
          ),
          size: rangeToDiff(specifier, sourceCode),
          node: specifier,
          group,
          name,
        }

        let lastSortingNode = formattedMembers.at(-1)?.at(-1)
        if (
          shouldPartition({
            lastSortingNode,
            sortingNode,
            sourceCode,
            options,
          })
        ) {
          formattedMembers.push([])
        }

        formattedMembers.at(-1)!.push(sortingNode)
      }

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
        ): SortNamedImportsSortingNode[] =>
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
            missedSpacingBetweenMembers: 'missedSpacingBetweenNamedImports',
            extraSpacingBetweenMembers: 'extraSpacingBetweenNamedImports',
            unexpectedGroupOrder: 'unexpectedNamedImportsGroupOrder',
            unexpectedOrder: 'unexpectedNamedImportsOrder',
          },
          sortNodesExcludingEslintDisabled,
          sourceCode,
          options,
          context,
          nodes,
        })
      }
    },
  }),
  meta: {
    schema: {
      items: {
        properties: {
          ...COMMON_JSON_SCHEMAS,
          groupKind: {
            description: '[DEPRECATED] Specifies top-level groups.',
            enum: ['mixed', 'values-first', 'types-first'],
            type: 'string',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema: SINGLE_CUSTOM_GROUP_JSON_SCHEMA,
          }),
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
          },
          partitionByNewLine: PARTITION_BY_NEW_LINE_JSON_SCHEMA,
          partitionByComment: PARTITION_BY_COMMENT_JSON_SCHEMA,
          newlinesBetween: NEWLINES_BETWEEN_JSON_SCHEMA,
          groups: GROUPS_JSON_SCHEMA,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      missedSpacingBetweenNamedImports: MISSED_SPACING_ERROR,
      extraSpacingBetweenNamedImports: EXTRA_SPACING_ERROR,
      unexpectedNamedImportsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedNamedImportsOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-named-imports',
      description: 'Enforce sorted named imports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [DEFAULT_OPTIONS],
  name: 'sort-named-imports',
})
