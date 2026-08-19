# Plan: Customer CRM and Enhanced Admin Dashboard

Add a CRM for managing customers (contacts) with script/video history, and upgrade the admin panel to a per-user statistics view with payment status.

## User Review Required

> [!IMPORTANT]
> The "Payment Status" and "Value" fields in the Admin view will be initialized as placeholders (e.g., "Paid" / "bash.00") since there is no existing payment integration. Would you like me to create a `user_payments` table to store this data?

- **Admin User View**: Confirm that "Payment in day" should be a manual field or if it should eventually link to a billing system.
- **Customer CRM**: Confirm if "Customer" (Cliente) is distinct from "User" (Usuário). I assume "Clientes" are external contacts created by the app users.

## Proposed Changes

### Database Schema (Supabase)

- **Create `clientes` table**:
    - `id` (uuid, PK)
    - `user_id` (uuid, FK to auth.users) - owner of the contact
    - `nome` (text)
    - `email` (text)
    - `telefone` (text)
    - `created_at` (timestamptz)
- **Create `cliente_historico` table** (to track sent content):
    - `id` (uuid, PK)
    - `cliente_id` (uuid, FK to clientes)
    - `roteiro_id` (uuid, FK to roteiros)
    - `tipo` (text: 'video' | 'roteiro')
    - `created_at` (timestamptz)
- **RLS Policies**: Standard owner-only access for users.

### Server Functions

- **src/lib/customers.functions.ts**:
    - `getCustomers`, `createCustomer`, `deleteCustomer`, `updateCustomer`.
    - `linkContentToCustomer`: Link a script or video to a customer.
- **Update src/lib/admin.functions.ts**:
    - New `getAdminUsersStats`: Returns a list of all users with counts for products, scripts, videos (total/edited), and mock payment status.

### UI Components

- **src/routes/dashboard.customers.index.tsx**: New CRM page.
    - List of contacts with search.
    - Modal to create/edit contacts.
    - Detail view showing "History of sent videos and scripts".
- **src/routes/admin/index.tsx**:
    - Replace "Total products and scripts" card with a "Users" table/grid.
    - Columns: User ID, Products Count, Scripts Count, Videos Count, Edited Videos Count, Payment Status, Value.
    - Clickable "Products Count" that opens the existing detailed product view for that specific user.
- **Navigation**:
    - Add "Clientes" to the Sidebar in `src/routes/dashboard.tsx`.

## Technical Details

- **Admin View Refactor**: Use TanStack Table or a clean Shadcn Table for the user list.
- **Admin Stats Aggregation**: The server function will use PostgreSQL aggregations (count/group by user_id) across all core tables.
- **Video Metadata**: Edited videos count will filter `roteiros` where the `conteudo` JSON contains `video_settings`.

