# Plano de Implementação: Upload de Vídeo Local

Adicionar a funcionalidade de upload de vídeo gravado localmente (arquivo do computador) como alternativa à gravação ao vivo na tela de gravação de roteiros.

## Alterações

### Componente de Interface
- **Botão de Seleção de Arquivo**: Adicionar um botão "Subir Vídeo" na tela de gravação (`src/routes/dashboard.record.$roteiroRowId.$scriptId.tsx`).
- **Input de Arquivo Oculto**: Implementar um `<input type="file" />` invisível que aceite formatos de vídeo (mp4, webm, mov).
- **Pré-visualização**: Ao selecionar um arquivo, o vídeo será exibido no player da tela, permitindo a conferência antes do salvamento.

### Lógica de Negócio
- **Processamento de Upload**:
  - Reutilizar a lógica existente de upload para o Supabase Storage (bucket `videos`).
  - Gerar a URL assinada (signed URL) para garantir o acesso permanente.
  - Salvar o link no banco de dados na tabela `roteiros` (coluna `video_url` dentro do JSON `conteudo`).

### UX/UI
- Manter a identidade visual **Dark Gold**.
- Adicionar estados de loading durante o processamento do arquivo.
- Notificações de sucesso/erro via `sonner`.

## Detalhes Técnicos
- **Localização**: `src/routes/dashboard.record.$roteiroRowId.$scriptId.tsx`.
- **API**: Utilizar o cliente Supabase para `storage.upload` e `storage.createSignedUrl`.
- **Limites**: O navegador gerencia o tamanho do arquivo, mas a interface mostrará feedback visual durante o carregamento.
