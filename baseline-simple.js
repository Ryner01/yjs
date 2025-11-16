/**
 * Simplified baseline creation using direct clone integration
 *
 * Warning: This uses private APIs (_integrate, share.set) which may
 * change in future Yjs versions. Use at your own risk.
 */

import * as Y from './src/index.js'

/**
 * Creates a baseline by directly cloning and integrating types.
 * This is more concise but uses private APIs.
 */
export function createBaselineSimple(sourceDoc, opts = {}) {
  const baseline = new Y.Doc(opts)

  baseline.transact(() => {
    sourceDoc.share.forEach((sourceType, name) => {
      const cloned = sourceType.clone()
      cloned._integrate(baseline, null)
      baseline.share.set(name, cloned)
    })
  })

  return baseline
}

/**
 * Creates a baseline using only public APIs.
 * More verbose but future-proof and type-safe.
 */
export function createBaselineSafe(sourceDoc, opts = {}) {
  const baseline = new Y.Doc(opts)

  baseline.transact(() => {
    sourceDoc.share.forEach((sourceType, name) => {
      if (sourceType instanceof Y.Text) {
        baseline.getText(name).applyDelta(sourceType.getContent())
      } else if (sourceType instanceof Y.Array) {
        const items = sourceType.toArray().map(item =>
          item instanceof Y.AbstractType ? item.clone() : item
        )
        baseline.getArray(name).insert(0, items)
      } else if (sourceType instanceof Y.Map) {
        sourceType.forEach((value, key) => {
          baseline.getMap(name).set(key,
            value instanceof Y.AbstractType ? value.clone() : value
          )
        })
      } else if (sourceType instanceof Y.XmlFragment) {
        const items = sourceType.toArray().map(item =>
          item instanceof Y.AbstractType ? item.clone() : item
        )
        baseline.getXmlFragment(name).insert(0, items)
      }
    })
  })

  return baseline
}

// Example
if (import.meta.url === `file://${process.argv[1]}`) {
  const original = new Y.Doc()
  const text = original.getText('mytext')

  // Create lots of fragmentation (simulate real editing)
  text.insert(0, 'Hello World')
  text.delete(6, 5)
  text.insert(6, 'Yjs')
  text.insert(0, 'Welcome to ')
  text.delete(11, 5)
  text.insert(11, 'awesome')
  text.format(0, 7, { bold: true })
  text.format(11, 7, { italic: true })

  console.log('Original text:', text.toString())
  console.log('Original update size:', Y.encodeStateAsUpdate(original).length)

  // Try both approaches
  const baseline1 = createBaselineSimple(original)
  const baseline2 = createBaselineSafe(original)

  console.log('\nBaseline (simple):')
  console.log('- Text:', baseline1.getText('mytext').toString())
  console.log('- Update size:', Y.encodeStateAsUpdate(baseline1).length)

  console.log('\nBaseline (safe):')
  console.log('- Text:', baseline2.getText('mytext').toString())
  console.log('- Update size:', Y.encodeStateAsUpdate(baseline2).length)

  console.log('\nBoth produce same content:', baseline1.getText('mytext').toString() === baseline2.getText('mytext').toString())
}
