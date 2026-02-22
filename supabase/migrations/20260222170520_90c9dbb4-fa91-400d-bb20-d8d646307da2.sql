-- Remove old constraint
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_status_check;

-- Add updated constraint with all valid statuses
ALTER TABLE public.pacientes ADD CONSTRAINT pacientes_status_check 
  CHECK (status IN (
    'Agendado', 
    'Compareceu', 
    'Faltou', 
    'Remarcado', 
    'Finalizado', 
    'Sem Interesse', 
    'Fechado'
  ));