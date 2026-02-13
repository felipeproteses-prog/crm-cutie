import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PacienteTableProps {
  pacientes: any[];
  columns: { key: string; label: string; render?: (p: any) => string }[];
  onDelete: (id: string) => void;
  showWhatsApp?: boolean;
}

const sendWhatsApp = (p: any) => {
  const endereco = "R. Guilherme Rocha 218, Edifício Jalcy Metrópole, Sala 902";
  const msg = `Olá ${p.nome}!👋\n\nEste é um lembrete de sua consulta marcada:\n\n📅 Data: ${p.data_agendamento}\n⏰ Horário: ${p.horario_agendamento}\n🦷 Procedimento: ${p.procedimentos}\n📍 Endereço: ${endereco}\n\n${p.observacoes ? "Observações: " + p.observacoes + "\n\n" : ""}Confirme sua presença! 😊`;
  const phone = p.telefone.replace(/\D/g, "");
  window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
};

const PacienteTable = ({ pacientes, columns, onDelete, showWhatsApp }: PacienteTableProps) => {
  if (pacientes.length === 0) {
    return <p className="mt-4 text-center text-muted-foreground">Nenhum paciente encontrado.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-primary/20">
      <table className="w-full">
        <thead>
          <tr className="bg-primary">
            {columns.map((c) => (
              <th key={c.key} className="p-3 text-left text-sm font-semibold text-primary-foreground">
                {c.label}
              </th>
            ))}
            <th className="p-3 text-left text-sm font-semibold text-primary-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id} className="border-b border-border transition-colors hover:bg-secondary/50">
              {columns.map((c) => (
                <td key={c.key} className="p-3 text-sm">
                  {c.render ? c.render(p) : p[c.key] ?? "-"}
                </td>
              ))}
              <td className="flex gap-2 p-3">
                {showWhatsApp && (
                  <Button size="sm" onClick={() => sendWhatsApp(p)} className="bg-[hsl(142,70%,49%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(142,70%,40%)] text-xs font-bold">
                    WhatsApp
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)} className="text-xs font-bold">
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PacienteTable;
