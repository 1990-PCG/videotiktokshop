import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProducts, deleteProduct } from "@/lib/products.functions";
import { generateScripts } from "@/lib/roteiros.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Trash2, FileText, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ProductModal } from "./ProductModal";
import { useNavigate } from "@tanstack/react-router";

export function ProductList() {
  const queryClient = useQueryClient();
  const getProductsFn = useServerFn(getProducts);
  const deleteProductFn = useServerFn(deleteProduct);
  const generateScriptsFn = useServerFn(generateScripts);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsFn(),
  });

  const { mutate: removeProduct } = useMutation({
    mutationFn: (id: string) => deleteProductFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const handleGenerateScripts = async (product: any) => {
    setGeneratingId(product.id);
    try {
      const result = await generateScriptsFn({
        data: {
          productId: product.id,
          nome: product.nome,
          categoria: product.categoria,
          preco: product.preco,
          descricao: product.descricao,
        }
      });
      
      toast.success("Roteiros gerados com sucesso!");
      navigate({ 
        to: "/dashboard/roteiros/$productId" as any, 
        params: { productId: product.id } 
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao gerar roteiros. Tente novamente.");
    } finally {
      setGeneratingId(null);
    }
  };

  if (isLoading) {
    return <div className="text-[#D4AF37] animate-pulse">Carregando produtos...</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-[#121212] p-8 rounded-full border border-[#D4AF37]/10 mb-6">
          <Package className="h-16 w-16 text-[#D4AF37]/20" />
        </div>
        <h3 className="text-[#FAFAFA] text-xl font-light mb-2">Nenhum produto encontrado</h3>
        <p className="text-[#FAFAFA]/60 max-w-xs mb-8">
          Você ainda não cadastrou nenhum produto. Comece agora mesmo!
        </p>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
        <ProductModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[#FAFAFA] text-lg font-light">Seus Produtos ({products.length})</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="bg-[#121212] border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#D4AF37]/60 mb-1 block">
                    {product.categoria || "Sem Categoria"}
                  </span>
                  <CardTitle className="text-[#FAFAFA] font-light text-lg leading-tight">
                    {product.nome}
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este produto?")) {
                      removeProduct(product.id);
                    }
                  }}
                  className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[#D4AF37] font-medium mb-4">
                {product.preco ? 
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco) 
                  : "Preço sob consulta"}
              </p>
              {product.descricao && (
                <p className="text-[#FAFAFA]/40 text-sm line-clamp-2 font-light">
                  {product.descricao}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                disabled={generatingId === product.id}
                onClick={() => handleGenerateScripts(product)}
                className="w-full border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-sm font-light"
              >
                {generatingId === product.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Roteiros
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <ProductModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
