# Plan - Implement "My Products" Screen

I will implement the "My Products" management screen within the dashboard, allowing users to create, list, and delete products stored in the database.

## UI Components
- **Modal Form**: Using `Dialog` from shadcn/ui for creating new products.
- **Form Fields**:
    - Name (Required)
    - Category (Select: Beleza, Gadgets, Casa, Moda, Alimentos, Outro)
    - Price (Numeric input with R$ formatting)
    - Description (Textarea, max 500 chars)
- **Product Cards**: A grid layout displaying product details.
- **Empty State**: An illustrative placeholder when no products are found.
- **Actions**: "Generate Scripts" (placeholder) and "Delete Product" on each card.

## Backend Integration
- **Server Functions**:
    - `getProducts`: Fetches the user's products.
    - `createProduct`: Inserts a new product into the `produtos` table.
    - `deleteProduct`: Removes a product by ID.
- **Authentication**: All functions will use `requireSupabaseAuth` to ensure user isolation.

## Technical Details
- **Data Fetching**: TanStack Query (`useQuery`, `useMutation`) for efficient state management and caching.
- **Form Handling**: `react-hook-form` with `zod` for validation.
- **Formatting**: Currency formatting for BRL.
