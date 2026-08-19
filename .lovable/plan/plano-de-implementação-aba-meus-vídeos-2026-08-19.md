# Plano de Implementação: Aba "Meus Vídeos"

Adicionar uma nova seção no dashboard para gerenciar os vídeos gravados a partir dos roteiros. A tela permitirá visualizar, baixar, editar (renomear/anotações) e excluir os vídeos.

## Alterações Sugeridas

### Backend e Lógica
- Criar a função `getVideos` no arquivo `src/lib/roteiros.functions.ts` para buscar todos os roteiros que possuem `video_url`.
- Criar a função `deleteScriptVideo` para remover o vídeo do bucket e atualizar o registro no banco de dados.

### Frontend
- **Navegação**: Adicionar o item "Meus Vídeos" no sidebar em `src/routes/dashboard.tsx`.
- **Nova Rota**: Criar `src/routes/dashboard.videos.index.tsx` para listar os vídeos.
- **Componentes**: 
  - Exibir os vídeos em uma grade de cards.
  - Cada card mostrará o nome do produto, o título do roteiro e um player simples ou miniatura.
  - Adicionar botões para: Ver/Baixar Vídeo, Excluir Vídeo e Editar (renomear o título interno do roteiro).

## Detalhes Técnicos
- O banco de dados já armazena a `video_url` dentro do JSON da coluna `conteudo` na tabela `roteiros`.
- A listagem filtrará os itens do JSON que possuem `video_url`.
- A exclusão removerá o arquivo do bucket `videos` e limpará o campo `video_url` no JSON.
- O botão "Editar" permitirá alterar o `titulo` do script no JSON.

---
*Vou começar criando a rota e as funções necessárias após a sua aprovação.*
