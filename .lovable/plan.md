# Plano de Ajustes Finais - Roteiro TikTok Shop

Implementação dos ajustes finais solicitados pelo usuário, incluindo contadores no dashboard, responsividade mobile completa, tratamento de erros na geração de roteiros e revisão da identidade visual Dark Gold.

## Alterações

### 1. Contadores no Dashboard
- Adicionar uma seção de estatísticas acima da listagem de produtos.
- Exibir o total de produtos e o total de roteiros gerados pelo usuário.

### 2. Responsividade Mobile
- Ajustar o layout do `Sidebar` para ser colapsável em dispositivos móveis (utilizando `Sheet` ou o comportamento padrão do componente `Sidebar` do shadcn).
- Garantir que grids de cards (`ProductList` e `RoteirosIndexView`) se adaptem corretamente a telas pequenas.
- Ajustar preenchimentos (paddings) e tamanhos de fonte para melhor legibilidade no celular.

### 3. Tratamento de Erro na Geração
- Implementar notificações visuais mais claras e tratamento de erro específico no `ProductList` e `RoteirosIndexView`.
- Garantir que o usuário saiba exatamente o que deu errado (limite de API, erro de rede, etc.).

### 4. Revisão da Identidade Visual (Dark Gold)
- Revisar consistência de cores nos `inputs`, `modais`, `botões` e `cards`.
- Refinar estados de `hover` e `focus` para manter o brilho dourado (#D4AF37) sobre o fundo preto (#0A0A0A).

## Detalhes Técnicos

- **Componentes**: Utilização de `lucide-react` para novos ícones, `shadcn/ui` para componentes de interface.
- **Estado**: `TanStack Query` para buscar dados e manter os contadores atualizados.
- **Estilos**: `Tailwind CSS` v4 para responsividade (`sm:`, `md:`, `lg:`).
- **Backend**: Nenhuma mudança no esquema do banco de dados necessária, apenas consultas adicionais.

## Diagrama de Layout Mobile
```text
+-----------------------+
| [=] Dashboard    [User]|
+-----------------------+
|   STATS: 5 Prod | 25 Rot|
+-----------------------+
|  + NOVO PRODUTO       |
+-----------------------+
| [ CARD PRODUTO ]      |
| [ CARD PRODUTO ]      |
+-----------------------+
```
