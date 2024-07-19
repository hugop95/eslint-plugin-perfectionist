import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedClassesOrder'

type Group =
  | 'private-decorated-accessor-property'
  | 'decorated-accessor-property'
  | 'private-decorated-property'
  | 'static-private-method'
  | 'decorated-set-method'
  | 'decorated-get-method'
  | 'decorated-property'
  | 'decorated-method'
  | 'private-property'
  | 'static-property'
  | 'index-signature'
  | 'private-method'
  | 'static-method'
  | 'constructor'
  | 'get-method'
  | 'set-method'
  | 'property'
  | 'unknown'
  | 'method'
  | string

type Options = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group[] | Group)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-classes'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted classes',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customGroups: {
            type: 'object',
          },
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          ignoreCase: {
            type: 'boolean',
            default: true,
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
          partitionByComment: {
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
            default: false,
          },
          groups: {
            type: 'array',
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let options = complete(context.options.at(0), {
          groups: ['property', 'constructor', 'method', 'unknown'],
          partitionByComment: false,
          type: 'alphabetical',
          ignoreCase: true,
          customGroups: {},
          order: 'asc',
        } as const)

        let sourceCode = getSourceCode(context)

        let formattedNodes: SortingNode[][] = node.body.reduce(
          (accumulator: SortingNode[][], member) => {
            let comment = getCommentBefore(member, sourceCode)

            if (
              options.partitionByComment &&
              comment &&
              isPartitionComment(options.partitionByComment, comment.value)
            ) {
              accumulator.push([])
            }

            let name: string
            let { getGroup, defineGroup, setCustomGroups } = useGroups(
              options.groups,
            )

            if (member.type === 'StaticBlock') {
              name = 'static'
            } else if (member.type === 'TSIndexSignature') {
              name = sourceCode.text.slice(
                member.range.at(0),
                member.typeAnnotation?.range.at(0) ?? member.range.at(1),
              )
            } else {
              if (member.key.type === 'Identifier') {
                ;({ name } = member.key)
              } else {
                name = sourceCode.text.slice(...member.key.range)
              }
            }

            let isPrivate = name.startsWith('_') || name.startsWith('#')
            let decorated =
              'decorators' in member && member.decorators.length > 0

            if (member.type === 'MethodDefinition') {
              if (member.kind === 'constructor') {
                defineGroup('constructor')
              }

              let isPrivateMethod =
                member.accessibility === 'private' || isPrivate

              let isStaticMethod = member.static

              if (decorated) {
                if (member.kind === 'get') {
                  defineGroup('decorated-get-method')
                }

                if (member.kind === 'set') {
                  defineGroup('decorated-set-method')
                }

                defineGroup('decorated-method')
              }

              if (isPrivateMethod && isStaticMethod) {
                defineGroup('static-private-method')
              }

              if (isPrivateMethod) {
                defineGroup('private-method')
              }

              if (isStaticMethod) {
                defineGroup('static-method')
              }

              if (member.kind === 'get') {
                defineGroup('get-method')
              }

              if (member.kind === 'set') {
                defineGroup('set-method')
              }

              defineGroup('method')
            } else if (member.type === 'TSIndexSignature') {
              defineGroup('index-signature')
            } else if (member.type === 'AccessorProperty') {
              if (decorated) {
                if (member.accessibility === 'private' || isPrivate) {
                  defineGroup('private-decorated-accessor-property')
                }

                defineGroup('decorated-accessor-property')
              }
            } else if (member.type === 'PropertyDefinition') {
              if (decorated) {
                if (member.accessibility === 'private' || isPrivate) {
                  defineGroup('private-decorated-property')
                }

                defineGroup('decorated-property')
              }

              if (member.accessibility === 'private' || isPrivate) {
                defineGroup('private-property')
              }

              if (member.static) {
                defineGroup('static-property')
              }

              defineGroup('property')
            }

            setCustomGroups(options.customGroups, name, {
              override: true,
            })

            let value = {
              size: rangeToDiff(member.range),
              group: getGroup(),
              node: member,
              name,
            }

            accumulator.at(-1)!.push(value)

            return accumulator
          },
          [[]],
        )

        for (let nodes of formattedNodes) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            if (
              left.name !== right.name &&
              (leftNum > rightNum ||
                (leftNum === rightNum &&
                  isPositive(compare(left, right, options))))
            ) {
              context.report({
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: (fixer: TSESLint.RuleFixer) => {
                  let grouped = nodes.reduce(
                    (
                      accumulator: {
                        [key: string]: SortingNode[]
                      },
                      sortingNode,
                    ) => {
                      let groupNum = getGroupNumber(options.groups, sortingNode)

                      if (!(groupNum in accumulator)) {
                        accumulator[groupNum] = [sortingNode]
                      } else {
                        accumulator[groupNum] = sortNodes(
                          [...accumulator[groupNum], sortingNode],
                          options,
                        )
                      }

                      return accumulator
                    },
                    {},
                  )

                  let sortedNodes: SortingNode[] = []

                  for (let group of Object.keys(grouped).sort(
                    (a, b) => Number(a) - Number(b),
                  )) {
                    sortedNodes.push(...sortNodes(grouped[group], options))
                  }

                  return makeFixes(fixer, nodes, sortedNodes, sourceCode, {
                    partitionComment: options.partitionByComment,
                  })
                },
              })
            }
          })
        }
      }
    },
  }),
})
