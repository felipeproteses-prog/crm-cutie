
-- Create pacientes table
CREATE TABLE public.pacientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_contato DATE,
  data_agendamento DATE,
  horario_agendamento TIME,
  status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Sem Interesse', 'Fechado')),
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  midia TEXT,
  procedimentos TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own data
CREATE POLICY "Users can view their own pacientes"
ON public.pacientes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pacientes"
ON public.pacientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pacientes"
ON public.pacientes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pacientes"
ON public.pacientes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pacientes_updated_at
BEFORE UPDATE ON public.pacientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
