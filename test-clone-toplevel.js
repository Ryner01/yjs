/**
 * Testing: Can we just .clone() top-level types directly?
 */

import * as Y from './src/index.js'

console.log('=== Testing Direct Clone of Top-Level Types ===\n')

// Setup: Create original doc with content
const original = new Y.Doc()
const originalText = original.getText('mytext')
originalText.insert(0, 'Hello World')

console.log('Original text:', originalText.toString())
console.log('Original is integrated:', originalText.doc !== null)

// Attempt 1: Clone the text
const clonedText = originalText.clone()

console.log('\nCloned text:')
console.log('- Is integrated:', clonedText.doc !== null)
console.log('- Has _prelim:', clonedText._prelim !== null)

// Can we call semantic methods on unintegrated clone?
try {
  const content = clonedText.getContent()
  console.log('- getContent() worked:', content)
} catch (e) {
  console.log('- getContent() failed:', e.message)
}

try {
  const str = clonedText.toString()
  console.log('- toString() result:', str)
} catch (e) {
  console.log('- toString() failed:', e.message)
}

// Attempt 2: Can we directly set it as a top-level type?
const baseline = new Y.Doc()

console.log('\n=== Attempt 2: Manually set in share ===')
try {
  // Try to manually add to share
  baseline.share.set('mytext', clonedText)
  clonedText._integrate(baseline, null)

  const retrieved = baseline.getText('mytext')
  console.log('Retrieved text:', retrieved.toString())
  console.log('Is same object:', retrieved === clonedText)
} catch (e) {
  console.log('Failed:', e.message)
}

// Attempt 3: The correct way - extract from integrated original
console.log('\n=== Attempt 3: Correct approach ===')
const baseline2 = new Y.Doc()
baseline2.transact(() => {
  // Get a fresh integrated type from baseline2
  const targetText = baseline2.getText('mytext')
  console.log('Target is integrated:', targetText.doc !== null)

  // Extract content from the INTEGRATED original (not the clone!)
  const content = originalText.getContent()
  console.log('Extracted content from original:', content)

  // Apply to integrated target
  targetText.applyDelta(content)
  console.log('Target text:', targetText.toString())
})

console.log('\n=== Why this matters ===')
console.log('Cloned types have preliminary content in _prelim/_prelimContent')
console.log('They need to be integrated into a doc before semantic methods work')
console.log('Top-level types MUST be created via doc.getText(), not manually added')
