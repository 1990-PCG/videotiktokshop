# TikTok Shop Script Generation Implementation

Implement the functionality to generate video scripts for TikTok Shop products using the Lovable AI Gateway (Claude 3.5 Sonnet) and integrate it with the dashboard.

## User-Facing Changes
- **New Feature**: "Generate Scripts" button on product cards now works.
- **New Screen**: "Scripts" view to display generated video scripts for a product.
- **Loading State**: Visual feedback during AI script generation.
- **Automatic Navigation**: Redirects to the scripts view after generation.

## Technical Details
- **AI Integration**: Use `ai_gateway` to call Claude 3.5 Sonnet with the specified system prompt for TikTok Shop scripts.
- **Data Model**: Store generated scripts in the `roteiros` table (JSONB format).
- **Server Functions**:
    - `generateScripts`: Calls AI Gateway, parses JSON response, and saves to database.
    - `getScriptsByProduct`: Retrieves saved scripts for a specific product.
- **Routes**:
    - Create `src/routes/dashboard.roteiros.$productId.tsx` for viewing scripts.
    - Update `src/routes/dashboard.tsx` to handle nested routes or conditional rendering.
- **Components**:
    - `ScriptDisplay`: A component to render the list of 5 generated scripts.
    - Update `ProductList` to handle the "Generating" state.

## Implementation Steps
1. Create `src/lib/roteiros.functions.ts` with `generateScripts` and `getScriptsByProduct`.
2. Create `src/routes/dashboard.roteiros.$productId.tsx` to display the scripts.
3. Update `src/components/products/ProductList.tsx` to call `generateScripts` and show loading state.
4. Ensure RLS policies and database schema for `roteiros` are correctly utilized.
