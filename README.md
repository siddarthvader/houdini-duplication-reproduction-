# Houdini `selectedOption` Duplication Bug - SvelteKit Reproduction

This is a complete, production-ready reproduction of the Houdini cache collision bug that causes `selectedOption` fields to show duplicated values in the UI when the same option ID appears in different contexts.

## 🐛 Problem Description

When GraphQL fragments with nested `selectedOption` fields contain the same option ID in different contexts, Houdini normalizes them to the same cache entry, causing UI duplication issues.

### Root Cause
```
Cache Normalization Collision:
┌─────────────────────────────────────┐
│ orderItems[0].optionSets[0]         │
│   selectedOption.id = "option_large"│ ──┐
└─────────────────────────────────────┘   │
                                           ├──► "CartItemOption:option_large"
┌─────────────────────────────────────┐   │    (Same cache key = collision)
│ orderItems[1].optionSets[0]         │   │
│   selectedOption.id = "option_large"│ ──┘
└─────────────────────────────────────┘
```

**Current cache key formula**: `{Type}:{ID}` ignores parent context.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /home/d2du/code/oss/houdini/duplicatation-bug/reproduction-sveltekit
npm install
```

### 2. Generate Houdini Stores
```bash
npm run houdini:generate
```

### 3. Start Both Services
```bash
# Option 1: Start both mock server and SvelteKit app
npm run dev:full

# Option 2: Start them separately in different terminals
# Terminal 1:
npm run mock-server

# Terminal 2:
npm run dev
```

### 4. Test the Bug
1. Open http://localhost:5173
2. Click "Fetch Order Data"
3. Check for duplication warnings in the UI
4. Open browser console to see debug logs

## 📁 Project Structure

```
reproduction-sveltekit/
├── src/
│   ├── client.ts                    # Houdini client configuration
│   ├── lib/
│   │   └── graphql/
│   │       ├── OrderByHash.graphql  # Main query
│   │       └── fragments/           # GraphQL fragments
│   │           ├── OrderFragment.graphql
│   │           ├── OrderItemFragment.graphql
│   │           ├── CartItemOptionSetFragment.graphql
│   │           └── CartItemOptionFragment.graphql
│   └── routes/
│       ├── +layout.svelte          # Main layout
│       └── +page.svelte            # Bug reproduction page
├── schema.graphql                   # GraphQL schema
├── houdini.config.js               # Houdini configuration
├── mock-server.js                  # Mock GraphQL server
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## 🔧 Mock GraphQL Server

The mock server provides data that triggers the duplication bug:

### Features
- **GraphQL Endpoint**: http://localhost:3000/graphql
- **GraphiQL Interface**: http://localhost:3000/graphql
- **Mock Data**: Contains same option ID in different contexts
- **Network Simulation**: 500ms delay to simulate real API

### Mock Data Structure
```json
{
  "orderByHash": {
    "order": {
      "orderItems": [
        {
          "optionSets": [
            {
              "selectedOption": {
                "id": "option_large"  // Same ID in different contexts
              }
            }
          ]
        },
        {
          "optionSets": [
            {
              "selectedOption": {
                "id": "option_large"  // ← COLLISION!
              }
            }
          ]
        }
      ]
    }
  }
}
```

## 🧪 Testing the Bug

### Manual Testing
1. **Start Services**: `npm run dev:full`
2. **Open App**: http://localhost:5173
3. **Fetch Data**: Click "Fetch Order Data"
4. **Check Results**:
   - Look for ⚠️ DUPLICATION DETECTED! warnings
   - Check browser console for debug logs
   - Verify same option appears in multiple contexts

### Automated Testing Scripts
```bash
# Test the bug reproduction
npm run test:bug

# Test the fix (after applying fix)
npm run test:fix
```

## 🔍 Debug Information

### Console Logs
The app logs detailed information about:
- Cache operations
- Fragment processing
- Data fetching
- Duplication detection

### Browser DevTools
1. Open browser console
2. Look for logs with prefixes:
   - `📦` - Data fetching
   - `🐛` - Debug information
   - `⚠️` - Warnings
   - `❌` - Errors

## 🛠️ Integration with Real Houdini

### Testing the Fix
1. **Apply Fix**: Modify `packages/houdini/src/runtime/cache/cache.ts`
2. **Rebuild**: `cd packages/houdini && npm run compile`
3. **Link**: `npm link ../houdini-main/packages/houdini`
4. **Test**: Run the reproduction and verify duplication is resolved

### Debug Logging
The fix includes debug logging that can be enabled by checking for `selectedOption` fields in cache operations.

## 📊 Expected Results

### Before Fix (Bug)
```
⚠️ DUPLICATION DETECTED!
Option ID: option_large
First occurrence: Item "Burger", Option Set "Size"
Duplicate occurrence: Item "Pizza", Option Set "Size"
```

### After Fix (Working)
```
✅ No Duplications Found
All option IDs are unique across contexts.
```

## 🔧 Technical Details

### The Fix
The fix modifies the `writeSelection()` method in `packages/houdini/src/runtime/cache/cache.ts` to create context-aware cache keys for `selectedOption` fields:

```typescript
// Create contextual cache key for selectedOption fields to prevent duplication
let contextualLinkedID = linkedID;
if (field === 'selectedOption' && linkedID) {
    contextualLinkedID = `${linkedID}__${parent}`;
}
```

### Cache Key Transformation
- **Before**: `CartItemOption:option_large` (collision)
- **After**: `CartItemOption:option_large__order.orderItems.0.optionSets.0.selectedOption` (unique)

## 🏗️ Development

### Adding New Test Cases
1. Modify `mock-server.js` to add new test data
2. Update GraphQL schema if needed
3. Regenerate Houdini stores: `npm run houdini:generate`
4. Test in the UI

### Customizing Mock Data
Edit the `mockData` object in `mock-server.js` to:
- Add more order items
- Change option IDs
- Modify the duplication pattern
- Test edge cases

## 📚 Related Files

### Original Bug Analysis
- `../summary.md` - High-level bug summary
- `../DETAILED_ANALYSIS.md` - Complete technical analysis
- `../debug-houdini-duplication.cjs` - Mock test script

### Fix Implementation
- `../../houdini-main/packages/houdini/src/runtime/cache/cache.ts` - Location of the fix

## 🤝 Contributing

This reproduction setup can be used to:
1. **Verify** the fix works correctly
2. **Test** edge cases and variations
3. **Demonstrate** the issue to stakeholders
4. **Contribute** back to the Houdini project

## 📄 License

MIT License - Feel free to use this reproduction setup for testing and development purposes.