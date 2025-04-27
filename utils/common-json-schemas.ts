import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

const TYPE_JSON_SCHEMA: JSONSchema4 = {
  enum: ['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'],
  description: 'Specifies the sorting method.',
  type: 'string',
}

const ORDER_JSON_SCHEMA: JSONSchema4 = {
  description:
    'Specifies whether to sort items in ascending or descending order.',
  enum: ['asc', 'desc'],
  type: 'string',
}

const ALPHABET_JSON_SCHEMA: JSONSchema4 = {
  description:
    "Used only when the `type` option is set to `'custom'`. Specifies the custom alphabet for sorting.",
  type: 'string',
}

const LOCALES_JSON_SCHEMA: JSONSchema4 = {
  oneOf: [
    {
      type: 'string',
    },
    {
      items: {
        type: 'string',
      },
      type: 'array',
    },
  ],
  description: 'Specifies the sorting locales.',
}

const IGNORE_CASE_JSON_SCHEMA: JSONSchema4 = {
  description: 'Controls whether sorting should be case-sensitive or not.',
  type: 'boolean',
}

const SPECIAL_CHARACTERS_JSON_SCHEMA: JSONSchema4 = {
  description:
    'Specifies whether to trim, remove, or keep special characters before sorting.',
  enum: ['remove', 'trim', 'keep'],
  type: 'string',
}

let buildFallbackSortJsonSchema = ({
  additionalProperties,
}: {
  additionalProperties?: Record<string, JSONSchema4>
} = {}): JSONSchema4 => ({
  properties: {
    order: ORDER_JSON_SCHEMA,
    type: TYPE_JSON_SCHEMA,
    ...additionalProperties,
  },
  description: 'Fallback sort order.',
  additionalProperties: false,
  minProperties: 1,
  type: 'object',
})

export let buildCommonJsonSchemas = ({
  additionalFallbackSortProperties,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> => ({
  fallbackSort: buildFallbackSortJsonSchema({
    additionalProperties: additionalFallbackSortProperties,
  }),
  specialCharacters: SPECIAL_CHARACTERS_JSON_SCHEMA,
  ignoreCase: IGNORE_CASE_JSON_SCHEMA,
  alphabet: ALPHABET_JSON_SCHEMA,
  locales: LOCALES_JSON_SCHEMA,
  order: ORDER_JSON_SCHEMA,
  type: TYPE_JSON_SCHEMA,
})

export const COMMON_JSON_SCHEMAS: Record<string, JSONSchema4> =
  buildCommonJsonSchemas()

export const NEWLINES_BETWEEN_JSON_SCHEMA: JSONSchema4 = {
  description: 'Specifies how to handle new lines between groups.',
  enum: ['ignore', 'always', 'never'],
  type: 'string',
}

export const GROUPS_JSON_SCHEMA: JSONSchema4 = {
  items: {
    oneOf: [
      {
        type: 'string',
      },
      {
        items: {
          type: 'string',
        },
        type: 'array',
      },
      {
        properties: {
          newlinesBetween: NEWLINES_BETWEEN_JSON_SCHEMA,
        },
        required: ['newlinesBetween'],
        additionalProperties: false,
        type: 'object',
      },
    ],
  },
  description: 'Specifies a list of groups for sorting.',
  type: 'array',
}

export const DEPRECATED_CUSTOM_GROUPS_JSON_SCHEMA: JSONSchema4 = {
  additionalProperties: {
    oneOf: [
      {
        type: 'string',
      },
      {
        items: {
          type: 'string',
        },
        type: 'array',
      },
    ],
  },
  description: 'Specifies custom groups.',
  type: 'object',
}

const SINGLE_REGEX_JSON_SCHEMA: JSONSchema4 = {
  oneOf: [
    {
      properties: {
        pattern: {
          description: 'Regular expression pattern.',
          type: 'string',
        },
        flags: {
          description: 'Regular expression flags.',
          type: 'string',
        },
      },
      additionalProperties: false,
      required: ['pattern'],
      // https://github.com/azat-io/eslint-plugin-perfectionist/pull/490#issuecomment-2720969705
      // Uncomment the code below in the next major version (v5)
      // To uncomment: required: ['pattern'],
      type: 'object',
    },
    {
      type: 'string',
    },
  ],
  description: 'Regular expression.',
}

export const REGEX_JSON_SCHEMA: JSONSchema4 = {
  oneOf: [
    {
      items: SINGLE_REGEX_JSON_SCHEMA,
      type: 'array',
    },
    SINGLE_REGEX_JSON_SCHEMA,
  ],
  description: 'Regular expression.',
}

const ALLOWED_PARTITION_BY_COMMENT_JSON_SCHEMA: JSONSchema4[] = [
  {
    type: 'boolean',
  },
  REGEX_JSON_SCHEMA,
]
export const PARTITION_BY_COMMENT_JSON_SCHEMA: JSONSchema4 = {
  oneOf: [
    ...ALLOWED_PARTITION_BY_COMMENT_JSON_SCHEMA,
    {
      properties: {
        block: {
          description: 'Enables specific block comments to separate the nodes.',
          oneOf: ALLOWED_PARTITION_BY_COMMENT_JSON_SCHEMA,
        },
        line: {
          description: 'Enables specific line comments to separate the nodes.',
          oneOf: ALLOWED_PARTITION_BY_COMMENT_JSON_SCHEMA,
        },
      },
      additionalProperties: false,
      minProperties: 1,
      type: 'object',
    },
  ],
  description:
    'Enables the use of comments to separate the nodes into logical groups.',
}

export const PARTITION_BY_NEW_LINE_JSON_SCHEMA: JSONSchema4 = {
  description:
    'Enables the use of newlines to separate the nodes into logical groups.',
  type: 'boolean',
}

export let buildUseConfigurationIfJsonSchema = ({
  additionalProperties,
}: {
  additionalProperties?: Record<string, JSONSchema4>
} = {}): JSONSchema4 => ({
  description:
    'Specifies filters to match a particular options configuration for a given element to sort.',
  properties: {
    allNamesMatchPattern: REGEX_JSON_SCHEMA,
    ...additionalProperties,
  },
  additionalProperties: false,
  type: 'object',
})

let buildCommonCustomGroupJsonSchemas = ({
  additionalFallbackSortProperties,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> => ({
  newlinesInside: {
    description:
      'Specifies how to handle new lines between members of the custom group.',
    enum: ['always', 'never'],
    type: 'string',
  },
  fallbackSort: buildFallbackSortJsonSchema({
    additionalProperties: additionalFallbackSortProperties,
  }),
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
  order: ORDER_JSON_SCHEMA,
  type: TYPE_JSON_SCHEMA,
})

export let buildCustomGroupsArrayJsonSchema = ({
  additionalFallbackSortProperties,
  singleCustomGroupJsonSchema,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
  singleCustomGroupJsonSchema?: Record<string, JSONSchema4>
}): JSONSchema4 => ({
  items: {
    oneOf: [
      {
        properties: {
          ...buildCommonCustomGroupJsonSchemas({
            additionalFallbackSortProperties,
          }),
          anyOf: {
            items: {
              properties: {
                ...singleCustomGroupJsonSchema,
              },
              description: 'Custom group.',
              additionalProperties: false,
              type: 'object',
            },
            type: 'array',
          },
        },
        description: 'Custom group block.',
        additionalProperties: false,
        required: ['groupName'],
        type: 'object',
      },
      {
        properties: {
          ...buildCommonCustomGroupJsonSchemas({
            additionalFallbackSortProperties,
          }),
          ...singleCustomGroupJsonSchema,
        },
        description: 'Custom group.',
        additionalProperties: false,
        required: ['groupName'],
        type: 'object',
      },
    ],
  },
  description: 'Defines custom groups to match specific members.',
  type: 'array',
})

export let buildCustomGroupModifiersJsonSchema = (
  modifiers: string[],
): JSONSchema4 => ({
  items: {
    enum: modifiers,
    type: 'string',
  },
  description: 'Modifier filters.',
  type: 'array',
})

export let buildCustomGroupSelectorJsonSchema = (
  selectors: string[],
): JSONSchema4 => ({
  description: 'Selector filter.',
  enum: selectors,
  type: 'string',
})
