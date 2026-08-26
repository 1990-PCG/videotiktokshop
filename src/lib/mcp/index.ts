import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import createProduct from "./tools/create-product";
import listScripts from "./tools/list-scripts";
import generateScripts from "./tools/generate-scripts";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "video-tiktok-shop",
  title: "Vídeo Tiktok Shop",
  version: "0.1.0",
  instructions:
    "Ferramentas do app Vídeo Tiktok Shop. Use list_products para ver os produtos do usuário, create_product para cadastrar um novo, list_scripts para ler roteiros já gerados e generate_scripts para criar 5 novos roteiros de vídeo com IA.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, createProduct, listScripts, generateScripts] as any[],
});
