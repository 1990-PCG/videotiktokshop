# Implementation Plan - TikTok Shop Script AI Enhancements

Add a profile screen, enhance script generation with custom parameters, and refine product management (edit/delete) while maintaining the Dark Gold aesthetic.

## User Review Required

> [!IMPORTANT]
> Google Auth still requires manual configuration of Client ID/Secret in the backend. I will provide the redirect URL and instructions again if needed.

- **Profile Screen**: Should it include more than just logout and email display? (e.g., name, usage stats)
- **Script Parameters**: Are there specific platforms or audiences beyond TikTok, YouTube, and Instagram that should be prioritized?

## Proposed Changes

### 1. Data Model & Backend (Supabase)
- Add columns to `produtos` table if needed for extra metadata (though current schema seems sufficient for now).
- Ensure RLS policies are robust for "Edit" operations (already implemented for Select/Insert/Delete).

### 2. Script Generation Enhancements
- **New Server Function**: Update `generateScripts` in `src/lib/roteiros.functions.ts` to accept `targetAudience` and `platform`.
- **Prompt Engineering**: Modify the AI prompt to incorporate these parameters for more tailored results.
- **UI Update**: Add platform and audience selection to the "Generate Scripts" trigger (likely a new dialog).

### 3. Product Management (Edit/Delete)
- **Edit Functionality**: Update `ProductModal.tsx` to handle both "Create" and "Edit" modes.
- **Server Function**: Add `updateProduct` to `src/lib/products.functions.ts`.
- **UI Update**: Add an "Edit" button (pencil icon) to the product cards in `ProductList.tsx`.

### 4. Profile Screen & Navigation
- **New Route**: Create `src/routes/dashboard.profile.tsx` for user settings and logout.
- **Sidebar Update**: Add a "Perfil" link to the dashboard sidebar.
- **Logout Refactor**: Centralize logout logic if necessary.

## Technical Details

- **Parameters**: `platform` (enum: TikTok, YouTube, Instagram, etc.), `targetAudience` (string).
- **Edit Logic**: Pass the existing product object to `ProductModal` to pre-fill the form.
- **RLS**: All updates will continue to use `eq("user_id", context.userId)` to ensure security.

## Visual Identity
- Maintain `#0A0A0A` (background) and `#D4AF37` (Gold) palette.
- Use `lucide-react` icons for new actions.
