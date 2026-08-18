# Plan - Configure Supabase Tables for Products and Scripts

I will set up the requested database schema in Lovable Cloud (Supabase) to support the TikTok Shop script generation platform.

## Database Schema
### Table: `produtos`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `auth.users`)
- `nome`: Text
- `categoria`: Text
- `preco`: Numeric
- `descricao`: Text
- `created_at`: Timestamp

### Table: `roteiros`
- `id`: UUID (Primary Key)
- `produto_id`: UUID (Foreign Key to `produtos`)
- `user_id`: UUID (Foreign Key to `auth.users`)
- `conteudo`: JSONB
- `created_at`: Timestamp

## Security (RLS)
- Enable Row Level Security (RLS) on both tables.
- Create policies to ensure users can only access (Select, Insert, Update, Delete) their own records based on `user_id = auth.uid()`.
- Grant necessary permissions to the `authenticated` and `service_role` roles.

## Technical Details
- Migration file: `supabase/migrations/20260818_create_products_and_scripts.sql`
- Tool: `supabase--migration`
