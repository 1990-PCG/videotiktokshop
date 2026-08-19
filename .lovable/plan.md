# Plan: Customer CRM and Enhanced Admin Dashboard

Add a CRM for managing customers (contacts) with script/video history, and upgrade the admin panel to a per-user statistics view with payment status.

## User Review Required

> [!IMPORTANT]
> The "Payment Status" and "Value" fields in the Admin view will be initialized as placeholders (e.g., "Paid" / "$0.00") since there is no existing payment integration. I will create a \`user_billing\` table to store this mock data so it can be viewed and edited in the Admin panel.

- **Admin User View**: I will implement the "Payment in day" and "Value" columns as requested. Since there's no payment gateway yet, these will be editable by an admin or defaulted to "Pending".
- **Customer CRM**: I will add a "Clientes" tab to the dashboard sidebar.

## Proposed Changes

### Database Schema (Supabase)

- **Create \`clientes\` table**:
    - \`id\` (uuid, PK)
    - \`user_id\` (uuid, FK to auth.users) - owner of the contact
    - \`nome\` (text)
    - \`email\` (text)
    - \`telefone\` (text)
    - \`created_at\` (timestamptz)
- **Create \`cliente_historico\` table**:
    - \`id\` (uuid, PK)
    - \`cliente_id\` (uuid, FK to clientes, cascade delete)
    - \`roteiro_id\` (uuid, FK to roteiros, cascade delete)
    - \`created_at\` (timestamptz)
- **Create \`user_billing\` table** (for admin view):
    - \`id\` (uuid, PK)
    - \`user_id\` (uuid, FK to auth.users, unique)
    - \`pagamento_em_dia\` (boolean, default true)
    - \`valor\` (numeric, default 0)
- **RLS Policies**: Standard owner-only access for \`clientes\` and \`cliente_historico\`. \`user_billing\` readable by owner, all by admin.

### Server Functions

- **src/lib/customers.functions.ts**:
    - CRUD for \`clientes\`.
    - \`getCustomerHistory(clienteId)\`: Fetches roteiros linked to a customer.
    - \`linkScriptToCustomer(clienteId, scriptId)\`: Adds entry to history.
- **Update src/lib/admin.functions.ts**:
    - \`getAdminUsersStats\`: Aggregates stats per user (products, scripts, videos, edited videos, billing).

### UI Components

- **src/routes/dashboard.customers.index.tsx**: New CRM page.
    - List of contacts.
    - Modal to create/edit contacts.
    - "History" section for each contact showing linked roteiros.
- **src/routes/admin/index.tsx**:
    - Replace central card with "Users" table.
    - Columns: ID, Products, Scripts, Videos, Edited, Payment, Value.
    - Clicking product count filters/shows products for that user.
- **Navigation**:
    - Add "Clientes" to Sidebar in \`src/routes/dashboard.tsx\`.

## Technical Details

- **Edited Videos Count**: Calculated by checking if \`roteiros.conteudo\` contains \`video_settings\`.
- **Total Videos**: Count of \`roteiros\` where \`conteudo->>'video_url'\` is not null.
