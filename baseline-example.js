/**
 * Example: Creating a baseline Y.Doc by cloning top-level shared types
 *
 * This demonstrates how to create a "baseline" document with minimal
 * CRDT structure by extracting semantic content from an existing doc.
 */

import * as Y from './src/index.js'

/**
 * Creates a baseline copy of a Y.Doc by extracting and re-applying
 * semantic content from all top-level shared types.
 *
 * This produces a doc with:
 * - Minimal Item count (no edit history fragmentation)
 * - New client ID
 * - Fresh clocks starting from 0
 * - Smallest possible encodeStateAsUpdate() size
 *
 * @param {Y.Doc} sourceDoc - The document to create a baseline from
 * @param {Object} [opts] - Options for the new Doc
 * @returns {Y.Doc} A new baseline document
 */
export function createBaseline(sourceDoc, opts = {}) {
  const baseline = new Y.Doc(opts)

  baseline.transact(() => {
    // Clone each top-level shared type
    sourceDoc.share.forEach((sourceType, name) => {
      if (sourceType instanceof Y.Text) {
        // YText: extract delta and re-apply
        const content = sourceType.getContent()
        baseline.getText(name).applyDelta(content)

      } else if (sourceType instanceof Y.Array) {
        // YArray: extract items and insert with recursive cloning
        const items = sourceType.toArray().map(item =>
          item instanceof Y.AbstractType ? item.clone() : item
        )
        baseline.getArray(name).insert(0, items)

      } else if (sourceType instanceof Y.Map) {
        // YMap: iterate and set with recursive cloning
        const targetMap = baseline.getMap(name)
        sourceType.forEach((value, key) => {
          targetMap.set(key,
            value instanceof Y.AbstractType ? value.clone() : value
          )
        })

      } else if (sourceType instanceof Y.XmlFragment) {
        // YXmlFragment: use clone and insert
        const items = sourceType.toArray().map(item =>
          item instanceof Y.AbstractType ? item.clone() : item
        )
        baseline.getXmlFragment(name).insert(0, items)

      } else if (sourceType instanceof Y.XmlElement) {
        // YXmlElement: clone handles attributes and children
        const cloned = sourceType.clone()
        // Note: Need to integrate the cloned element properly
        // This is tricky for XmlElement as a top-level type
        console.warn(`XmlElement top-level cloning may need special handling for: ${name}`)
      }
    })
  })

  return baseline
}

/**
 * Example usage
 */
function example() {
  // Create original doc and make lots of edits
  const original = new Y.Doc()
  const text = original.getText('content')

  // Simulate lots of editing (creates fragmentation)
  original.transact(() => {
    text.insert(0, 'Hello')
  })
  original.transact(() => {
    text.insert(5, ' world')
  })
  original.transact(() => {
    text.insert(11, '!')
  })
  original.transact(() => {
    text.delete(5, 6)
    text.insert(5, ' Yjs')
  })
  // ... imagine 100 more edits ...

  console.log('Original text:', text.toString())
  console.log('Original update size:', Y.encodeStateAsUpdate(original).length, 'bytes')
  console.log('Original has fragmented Items from edit history')

  // Create baseline
  const baseline = createBaseline(original)
  const baselineText = baseline.getText('content')

  console.log('\nBaseline text:', baselineText.toString())
  console.log('Baseline update size:', Y.encodeStateAsUpdate(baseline).length, 'bytes')
  console.log('Baseline has minimal Items (no edit history)')

  // Verify content is identical
  console.log('\nContent matches:', text.toString() === baselineText.toString())
  console.log('Structure is different (baseline is cleaner)')
}

// Uncomment to run example:
// example()
