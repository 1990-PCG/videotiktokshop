-- Table for customers (contacts)
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for tracking which scripts/videos were sent to which customer
CREATE TABLE public.cliente_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    roteiro_id UUID NOT NULL REFERENCES public.roteiros(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for user billing status (mock data for admin view)
CREATE TABLE public.user_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    pagamento_em_dia BOOLEAN DEFAULT true,
    valor NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_historico TO authenticated;
GRANT ALL ON public.cliente_historico TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_billing TO authenticated;
GRANT ALL ON public.user_billing TO service_role;

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

-- Policies for Clientes
CREATE POLICY "Users can manage their own customers"
ON public.clientes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for Cliente Historico
CREATE POLICY "Users can manage history of their customers"
ON public.cliente_historico
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.clientes
        WHERE clientes.id = cliente_historico.cliente_id
        AND clientes.user_id = auth.uid()
    )
);

-- Policies for User Billing
CREATE POLICY "Users can see their own billing"
ON public.user_billing
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all billing"
ON public.user_billing
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
