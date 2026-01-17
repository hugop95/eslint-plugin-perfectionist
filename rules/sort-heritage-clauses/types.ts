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

export let allSelectors = [] as const
export type Selector = (typeof allSelectors)[number]

export let allModifiers = [] as const
export type Modifier = (typeof allModifiers)[number]
