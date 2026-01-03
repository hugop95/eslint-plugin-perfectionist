import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortModulesSortingNode,
  DependencyDetection,
  SortModulesNode,
} from './types'

import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { computeDeepScopeReferences } from '../../utils/compute-deep-scope-references'
import { rangeContainsSubrange } from '../../utils/range-contains-subrange'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { isPropertyOrAccessorNode } from './is-property-or-accessor-node'
import { isArrowFunctionNode } from './is-arrow-function-node'

type SortingNodeWithRelevantFields = Pick<
  SortModulesSortingNode,
  'dependencyDetection' | 'node'
>

export function computeDependenciesByNode({
  dependencyDetection,
  sortingNodes,
  sourceCode,
}: {
  sortingNodes: SortingNodeWithRelevantFields[]
  dependencyDetection: DependencyDetection
  sourceCode: TSESLint.SourceCode
}): Map<SortModulesNode, SortModulesNode[]> {
  let returnValue = new Map<SortModulesNode, SortModulesNode[]>()

  let references = sortingNodes.flatMap(sortingNode =>
    computeDeepScopeReferences(sortingNode.node, sourceCode),
  )
  for (let reference of new Set(references)) {
    let { identifier, resolved } = reference
    if (!resolved) {
      continue
    }

    let referencingSortingNode = findSortingNodeContainingIdentifier(identifier)
    if (!referencingSortingNode) {
      continue
    }
    if (
      !shouldConsiderSortingNode(referencingSortingNode, dependencyDetection)
    ) {
      continue
    }

    if (
      !shouldConsiderIdentifier({
        referencingSortingNode,
        dependencyDetection,
        identifier,
      })
    ) {
      continue
    }

    let [firstIdentifier] = resolved.identifiers
    if (!firstIdentifier) {
      continue
    }

    let referencedSortingNode =
      findSortingNodeContainingIdentifier(firstIdentifier)
    if (!referencedSortingNode) {
      continue
    }
    if (
      !shouldConsiderSortingNode(referencedSortingNode, dependencyDetection)
    ) {
      continue
    }

    if (referencedSortingNode === referencingSortingNode) {
      continue
    }

    let referencedNodes = returnValue.get(referencingSortingNode.node) ?? []
    returnValue.set(referencingSortingNode.node, referencedNodes)

    referencedNodes.push(referencedSortingNode.node)
  }

  return returnValue

  function findSortingNodeContainingIdentifier(
    identifier: TSESTree.JSXIdentifier | TSESTree.Identifier,
  ): SortingNodeWithRelevantFields | undefined {
    return sortingNodes.find(sortingNode =>
      rangeContainsSubrange(sortingNode.node.range, identifier.range),
    )
  }
}

function shouldConsiderIdentifier({
  referencingSortingNode,
  dependencyDetection,
  identifier,
}: {
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier
  referencingSortingNode: SortingNodeWithRelevantFields
  dependencyDetection: DependencyDetection
}): boolean {
  switch (dependencyDetection) {
    case 'soft':
      return true
    case 'hard':
      return isInRelevantClassContext()
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(dependencyDetection)
  }

  function isInRelevantClassContext(): boolean {
    let relevantParentNodes = computeParentNodesWithTypes({
      allowedTypes: [
        AST_NODE_TYPES.ClassBody,
        AST_NODE_TYPES.PropertyDefinition,
        AST_NODE_TYPES.AccessorProperty,
        AST_NODE_TYPES.MethodDefinition,
        AST_NODE_TYPES.ArrowFunctionExpression,
      ],
      maxParent: referencingSortingNode.node,
      node: identifier,
    })
    let firstClassBodyParent = relevantParentNodes.findIndex(
      parentNode => parentNode.type === AST_NODE_TYPES.ClassBody,
    )
    if (firstClassBodyParent < 0) {
      return true
    }
    let classBody = relevantParentNodes[
      firstClassBodyParent
    ] as TSESTree.ClassBody

    let searchStaticMethodsAndFunctionProperties = classBody.body.some(
      classElement =>
        classElement.type === AST_NODE_TYPES.StaticBlock ||
        (classElement.static &&
          isPropertyOrAccessorNode(classElement) &&
          !isArrowFunctionNode(classElement)),
    )

    let otherParents = relevantParentNodes.slice(0, firstClassBodyParent)
    return otherParents.every(otherParent =>
      isClassElementRelevant(
        otherParent,
        searchStaticMethodsAndFunctionProperties,
      ),
    )
  }

  function isClassElementRelevant(
    classElement:
      | TSESTree.ArrowFunctionExpression
      | TSESTree.PropertyDefinition
      | TSESTree.AccessorProperty
      | TSESTree.MethodDefinition
      | TSESTree.ClassBody,
    searchStaticMethodsAndFunctionProperties: boolean,
  ): boolean {
    if (
      classElement.type !== AST_NODE_TYPES.MethodDefinition &&
      !isArrowFunctionNode(classElement)
    ) {
      return true
    }

    return classElement.static && searchStaticMethodsAndFunctionProperties
  }
}

function shouldConsiderSortingNode(
  node: SortingNodeWithRelevantFields,
  dependencyDetection: DependencyDetection,
): boolean {
  switch (dependencyDetection) {
    case 'hard':
      return node.dependencyDetection === 'hard'
    case 'soft':
      return true
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(dependencyDetection)
  }
}
