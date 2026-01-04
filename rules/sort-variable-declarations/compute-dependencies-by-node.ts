import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortVariableDeclarationsNode } from './types'

import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { computeDeepScopeReferences } from '../../utils/compute-deep-scope-references'
import { rangeContainsSubrange } from '../../utils/range-contains-subrange'

export function computeDependenciesByNode({
  sourceCode,
  nodes,
}: {
  nodes: SortVariableDeclarationsNode[]
  sourceCode: TSESLint.SourceCode
}): Map<SortVariableDeclarationsNode, SortVariableDeclarationsNode[]> {
  let returnValue = new Map<
    SortVariableDeclarationsNode,
    SortVariableDeclarationsNode[]
  >()

  let references = nodes.flatMap(node =>
    computeDeepScopeReferences(node, sourceCode),
  )
  for (let reference of new Set(references)) {
    let { identifier, resolved } = reference
    if (!resolved) {
      continue
    }

    let referencingNode = findNodeContainingIdentifier(identifier)
    if (!referencingNode) {
      continue
    }

    if (!shouldConsiderIdentifier(identifier, referencingNode)) {
      continue
    }

    let [firstIdentifier] = resolved.identifiers
    if (!firstIdentifier) {
      continue
    }

    let referencedNode = findNodeContainingIdentifier(firstIdentifier)
    if (!referencedNode) {
      continue
    }

    if (referencedNode === referencingNode) {
      continue
    }

    let referencedNodes = returnValue.get(referencingNode) ?? []
    returnValue.set(referencingNode, referencedNodes)

    referencedNodes.push(referencedNode)
  }

  return returnValue

  function findNodeContainingIdentifier(
    identifier: TSESTree.JSXIdentifier | TSESTree.Identifier,
  ): SortVariableDeclarationsNode | undefined {
    return nodes.find(node =>
      rangeContainsSubrange(node.range, identifier.range),
    )
  }
}

function shouldConsiderIdentifier(
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier,
  referencingNode: SortVariableDeclarationsNode,
): boolean {
  let ignoredParentNodes = computeParentNodesWithTypes({
    allowedTypes: [
      AST_NODE_TYPES.FunctionExpression,
      AST_NODE_TYPES.ArrowFunctionExpression,
    ],
    maxParent: referencingNode,
    node: identifier,
  })

  return ignoredParentNodes.length === 0
}
