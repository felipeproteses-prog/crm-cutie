import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReagendarDialogProps {
  open: boolean;
  onClose: () => void;
  paciente: any;
  userId: string;
  onSaved: () => void;
}

const ReagendarDialog = ({ open, onClose, paciente, userId, onSaved }: ReagendarDialogProps) => {
  const [novaData, setNovaData] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReagendar = async () => {
    if (!novaData || !novoHorario) {
      toast.error("Informe nova data e horário.");
      return;
    }

    setLoading(true);

    // Save history
    const { error: histError } = await supabase.from("historico_reagendamentos").insert({
      paciente_id: paciente.id,
      user_id: userId,
      data_anterior: paciente.data_agendamento,
      horario_anterior: paciente.horario_agendamento,
      status_anterior: paciente.status,
      data_nova: novaData,
      horario_novo: novoHorario,
      motivo: motivo || null,
    });

    if (histError) {
      toast.error("Erro ao salvar histórico.");
      setLoading(false);
      return;
    }

    // Update patient
    const { error } = await supabase
      .from("pacientes")
      .update({
        data_agendamento: novaData,
        horario_agendamento: novoHorario,
        status: "Remarcado",
      })
      .eq("id", paciente.id);

    setLoading(false);

    if (error) {
      toast.error("Erro ao reagendar.");
    } else {
      toast.success("Paciente reagendado com sucesso!");
      setNovaData("");
      setNovoHorario("");
      setMotivo("");
      onSaved();
      onClose();
    }
  };

  if (!paciente) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🔁 Reagendar - {paciente.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Agendamento atual:</p>
            <p className="font-bold">
              📅 {paciente.data_agendamento || "Sem data"} ⏰ {paciente.horario_agendamento || "Sem horário"}
            </p>
            <p className="text-sm">Status: {paciente.status}</p>
          </div>

          <div>
            <Label>Nova Data *</Label>
            <Input
              type="date"
              className="mt-1 bg-secondary border-primary/30"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <div>
            <Label>Novo Horário *</Label>
            <Input
              type="time"
              className="mt-1 bg-secondary border-primary/30"
              value={novoHorario}
              onChange={(e) => setNovoHorario(e.target.value)}
            />
          </div>
          <div>
            <Label>Motivo</Label>
            <textarea
              className="mt-1 w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground min-h-[60px]"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Paciente solicitou troca"
            />
          </div>
          <Button
            onClick={handleReagendar}
            disabled={loading}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/80 font-bold"
          >
            {loading ? "Reagendando..." : "🔁 Confirmar Reagendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReagendarDialog;
