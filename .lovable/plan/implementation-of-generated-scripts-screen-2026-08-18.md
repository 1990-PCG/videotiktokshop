# Implementation of "Generated Scripts" Screen

Implement a comprehensive view for all generated scripts, grouped by product, with management capabilities.

## User-Facing Changes
- **New Screen**: "Roteiros Gerados" menu item now works, leading to a page showing all scripts.
- **Grouping**: Scripts are grouped by product using an accordion for better organization.
- **Enhanced Script Cards**: Each script card includes title, hook, content, and CTA.
- **Management**: 
    - Individual "Copy" and "Delete" buttons for each script.
    - "Generate 5 More" button at the top of each product section.
- **Loading States**: Visual feedback during additional script generation.

## Technical Details
- **Server Functions**:
    - `getAllScriptsGrouped`: New function to fetch all products and their scripts.
    - `deleteIndividualScript`: New function to remove one script from the JSONB array in the database.
    - `appendScripts`: Modified or new logic to handle adding AI-generated scripts to the existing array for a product.
- **Components**:
    - `RoteirosAccordion`: Uses shadcn/ui Accordion to group scripts by product.
    - `ScriptCard`: Reusable component for individual script display with Copy/Delete actions.
- **Routes**:
    - Implement `src/routes/dashboard.roteiros.index.tsx`.
    - Update sidebar in `src/routes/dashboard.tsx` to enable the link.

## Implementation Steps
1. Update `src/lib/roteiros.functions.ts` to include `getAllScriptsGrouped`, `deleteIndividualScript`, and modify `generateScripts` to support appending.
2. Create `src/routes/dashboard.roteiros.index.tsx` with the accordion layout.
3. Update `src/routes/dashboard.tsx` to enable the sidebar link.
4. Refactor `src/routes/dashboard.roteiros.$productId.tsx` to use shared components if applicable (optional but good for consistency).
