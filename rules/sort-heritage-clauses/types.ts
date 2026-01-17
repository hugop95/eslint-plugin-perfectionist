import type { AllCommonOptions } from '../../types/all-common-options'
import type { TypeOption } from '../../types/common-options'

export type Options = Partial<
  AllCommonOptions<TypeOption, AdditionalSortOptions, CustomGroupMatchOptions>
>[]

/**
 * Match options for a custom group.
 */
type CustomGroupMatchOptions = object

type AdditionalSortOptions = object

export let allSortedSelectors = [] as const
export type Selector = (typeof allSortedSelectors)[number]

export let allSortedModifiers = [] as const
export type Modifier = (typeof allSortedModifiers)[number]
