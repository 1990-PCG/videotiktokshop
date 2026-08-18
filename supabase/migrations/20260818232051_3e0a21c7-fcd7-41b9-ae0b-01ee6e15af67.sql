-- Table: produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT,
    preco NUMERIC,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: roteiros
CREATE TABLE IF NOT EXISTS public.roteiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    conteudo JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiros TO authenticated;
GRANT ALL ON public.roteiros TO service_role;

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;

-- Policies for produtos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'produtos' AND policyname = 'Users can manage their own products'
    ) THEN
        CREATE POLICY "Users can manage their own products"
        ON public.produtos
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Policies for roteiros
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'roteiros' AND policyname = 'Users can manage their own scripts'
    ) THEN
        CREATE POLICY "Users can manage their own scripts"
        ON public.roteiros
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
