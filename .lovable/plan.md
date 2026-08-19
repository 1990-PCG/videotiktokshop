# Plan - Admin Panel and Video Recording

Implement an admin panel for global data visibility and a video recording feature for scripts with automatic subtitle overlay and storage.

## User Review Required

> [!IMPORTANT]
> The admin panel requires at least one user to be manually assigned the 'admin' role in the database. I will provide instructions on how to do this after the implementation.

## Proposed Changes

### 1. Security & Admin System (Backend)
- Create `user_roles` table and `app_role` enum (`admin`, `user`).
- Implement `has_role` security definer function for RLS.
- Update `produtos` and `roteiros` RLS policies:
  - Users can see their own data.
  - Admins can see ALL data.
- Create a storage bucket named `videos` for recorded files.

### 2. Admin Interface (Frontend)
- Create `src/routes/admin.tsx` (layout) and `src/routes/admin/index.tsx`.
- The admin dashboard will list all products and scripts from all users.
- Add "Admin Panel" link to the main sidebar (visible only to admins).

### 3. Video Recording Feature
- Create `src/routes/dashboard.record.tsx` with `$roteiroRowId` and `$scriptId` as parameters.
- Implement recording using `MediaRecorder` API:
  - Capture video and audio.
  - Display script text as an overlay during recording (teleprompter style).
- Create a server function `uploadScriptVideo` to:
  - Upload the video file to storage.
  - Update the `video_url` field within the specific script in the `roteiros.conteudo` JSONB array.
- Add "Record Video" button to script cards in the "Generated Scripts" view.

### 4. Logic Updates
- Update `roteiros.functions.ts` to include video management functions.
- Add video playback or link to the script cards if a video exists.

## Technical Details

- **Admin Check**: Use the `has_role` function in RLS: `OR (public.has_role(auth.uid(), 'admin'))`.
- **Recording**: Use `navigator.mediaDevices.getUserMedia` and `MediaRecorder`.
- **Storage**: `supabase.storage.from('videos').upload()`.
- **JSONB Update**: Use a server function to find the script by ID in the array, update its `video_url`, and save back to the database.
