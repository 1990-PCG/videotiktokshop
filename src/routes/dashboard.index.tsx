import { createFileRoute } from "@tanstack/react-router";
import { ProductList } from "@/components/products/ProductList";

export const Route = createFileRoute("/dashboard/")({
  component: ProductList,
});
