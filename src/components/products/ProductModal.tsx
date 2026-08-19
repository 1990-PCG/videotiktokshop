import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useServerFn } from "@tanstack/react-start"
import { createProduct, updateProduct } from "@/lib/products.functions"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  preco: z.string().optional().or(z.literal("")),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>;

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const queryClient = useQueryClient()
  const createProductFn = useServerFn(createProduct)
  const updateProductFn = useServerFn(updateProduct)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      preco: "",
      descricao: "",
    },
  })

  // Update form values when product changes
  React.useEffect(() => {
    if (product && open) {
      form.reset({
        nome: product.nome || "",
        categoria: product.categoria || "",
        preco: product.preco ? product.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "",
        descricao: product.descricao || "",
      });
    } else if (!product && open) {
      form.reset({
        nome: "",
        categoria: "",
        preco: "",
        descricao: "",
      });
    }
  }, [product, open, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const precoNumber = values.preco 
        ? parseFloat(values.preco.replace(/[^\d.,]/g, "").replace(",", ".")) 
        : null;
      
      if (product?.id) {
        return updateProductFn({
          data: {
            id: product.id,
            nome: values.nome,
            categoria: values.categoria,
            preco: precoNumber,
            descricao: values.descricao || null,
          }
        });
      }

      return createProductFn({
        data: {
          nome: values.nome,
          categoria: values.categoria,
          preco: precoNumber,
          descricao: values.descricao || null,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(product ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!")
      onOpenChange(false)
      form.reset()
    },
    onError: (error) => {
      toast.error("Erro ao salvar produto: " + error.message)
    },
  })

  function onSubmit(values: FormValues) {
    mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ring Light 12\" {...field} className="bg-[#0A0A0A] border-[#D4AF37]/20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-[#0A0A0A] border-[#D4AF37]/20">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
                      <SelectItem value="Beleza">Beleza</SelectItem>
                      <SelectItem value="Gadgets">Gadgets</SelectItem>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Moda">Moda</SelectItem>
                      <SelectItem value="Alimentos">Alimentos</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="0,00" 
                      {...field} 
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "")
                        val = (Number(val) / 100).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2
                        })
                        field.onChange(val)
                      }}
                      className="bg-[#0A0A0A] border-[#D4AF37]/20" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o produto..." 
                      className="resize-none bg-[#0A0A0A] border-[#D4AF37]/20 min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90 w-full"
              >
                {isPending ? "Salvando..." : (product ? "Atualizar Produto" : "Salvar Produto")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}