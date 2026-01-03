import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'

import { buildCustomGroupSelectorJsonSchema } from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-variable-declarations rule.
 *
 * Controls how multiple variable declarations in a single statement are sorted,
 * such as `const a = 1, b, c = 3;`.
 */
export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup, Record<string, never>, TypeOption> &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

export type SortVariableDeclarationsSortingNode =
  SortingNodeWithDependencies<SortVariableDeclarationsNode>

export type SortVariableDeclarationsNode =
  TSESTree.VariableDeclaration['declarations'][number]

/**
 * Union type of all available selectors for variable declarations.
 *
 * Distinguishes between variables with and without initial values.
 */
export type Selector = (typeof allSelectors)[number]

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * The selector type this group matches. Can be 'initialized' for variables
   * with values or 'uninitialized' for variables without.
   */
  selector?: Selector
}

/**
 * Array of all available selectors for variable declarations.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = ['initialized', 'uninitialized'] as const

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the
 * sort-variable-declarations rule.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
