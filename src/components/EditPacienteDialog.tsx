import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EditPacienteDialogProps {
  open: boolean;
  onClose: () => void;
  paciente: any;
  onSaved: () => void;
}

const EditPacienteDialog = ({ open, onClose, paciente, onSaved }: EditPacienteDialogProps) => {
  const [form, setForm] = useState({
    nome: "", telefone: "", data_contato: "", data_agendamento: "",
    horario_agendamento: "", status: "Agendado", valor: "0",
    midia: "", procedimentos: "", observacoes: "",
    tipo_atendimento: "Avaliação", lembrete_ativo: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && paciente) {
      setForm({
        nome: paciente.nome || "",
        telefone: paciente.telefone || "",
        data_contato: paciente.data_contato || "",
        data_agendamento: paciente.data_agendamento || "",
        horario_agendamento: paciente.horario_agendamento || "",
        status: paciente.status || "Agendado",
        valor: String(paciente.valor ?? 0),
        midia: paciente.midia || "",
        procedimentos: paciente.procedimentos || "",
        observacoes: paciente.observacoes || "",
        tipo_atendimento: paciente.tipo_atendimento || "Avaliação",
        lembrete_ativo: paciente.lembrete_ativo ?? false,
      });
    }
  }, [open, paciente]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error("Preencha nome e telefone!");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("pacientes")
      .update({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        data_contato: form.data_contato || null,
        data_agendamento: form.data_agendamento || null,
        horario_agendamento: form.horario_agendamento || null,
        status: form.status,
        valor: parseFloat(form.valor) || 0,
        midia: form.midia || null,
        procedimentos: form.procedimentos || null,
        observacoes: form.observacoes || null,
        tipo_atendimento: form.tipo_atendimento || "Avaliação",
        lembrete_ativo: form.lembrete_ativo,
      })
      .eq("id", paciente.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao atualizar paciente.");
    } else {
      toast.success("Paciente atualizado com sucesso!");
      onSaved();
      onClose();
    }
  };

  if (!paciente) return null;

  const selectClass = "w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Editar Paciente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Nome *</Label><Input className="mt-1 bg-secondary border-primary/30" value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
          <div><Label>Telefone *</Label><Input className="mt-1 bg-secondary border-primary/30" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
          <div><Label>Data de Contato</Label><Input type="date" className="mt-1 bg-secondary border-primary/30" value={form.data_contato} onChange={(e) => set("data_contato", e.target.value)} /></div>
          <div><Label>Data de Agendamento</Label><Input type="date" className="mt-1 bg-secondary border-primary/30" value={form.data_agendamento} onChange={(e) => set("data_agendamento", e.target.value)} /></div>
          <div><Label>Horário</Label><Input type="time" className="mt-1 bg-secondary border-primary/30" value={form.horario_agendamento} onChange={(e) => set("horario_agendamento", e.target.value)} /></div>
          <div>
            <Label>Status *</Label>
            <select className={selectClass + " mt-1"} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="Agendado">Agendado</option>
              <option value="Compareceu">Compareceu</option>
              <option value="Faltou">Faltou</option>
              <option value="Remarcado">Remarcado</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Sem Interesse">Sem Interesse</option>
              <option value="Fechado">Fechado</option>
            </select>
          </div>
          <div><Label>Valor (R$)</Label><Input type="number" step="0.01" className="mt-1 bg-secondary border-primary/30" value={form.valor} onChange={(e) => set("valor", e.target.value)} /></div>
          <div>
            <Label>Mídia</Label>
            <select className={selectClass + " mt-1"} value={form.midia} onChange={(e) => set("midia", e.target.value)}>
              <option value="">Selecione</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Google">Google</option>
              <option value="Indicação">Indicação</option>
              <option value="Telefone">Telefone</option>
              <option value="Guilherme">Guilherme</option>
            </select>
          </div>
          <div>
            <Label>Tipo de Atendimento</Label>
            <select className={selectClass + " mt-1"} value={form.tipo_atendimento} onChange={(e) => set("tipo_atendimento", e.target.value)}>
              <option value="Avaliação">Avaliação</option>
              <option value="Prova da prótese">Prova da prótese</option>
              <option value="Entrega da prótese">Entrega da prótese</option>
              <option value="Ajuste pós-entrega">Ajuste pós-entrega</option>
              <option value="Retorno comum">Retorno comum</option>
            </select>
          </div>
          <div>
            <Label>Tipo de Procedimento</Label>
            <select className={selectClass + " mt-1"} value={form.procedimentos} onChange={(e) => set("procedimentos", e.target.value)}>
              <option value="">Selecione</option>
              <option value="Prótese Dentária">Prótese Dentária</option>
              <option value="Prótese Total">Prótese Total</option>
              <option value="Prótese Mista">Prótese Mista</option>
              <option value="Prótese Flex">Prótese Flex</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Restauração">Restauração</option>
              <option value="Clareamento">Clareamento</option>
              <option value="Implantado">Implantado</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <textarea className={selectClass + " mt-1 min-h-[80px]"} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              id="lembrete-edit"
              checked={form.lembrete_ativo}
              onChange={(e) => setForm((f) => ({ ...f, lembrete_ativo: e.target.checked }))}
              className="h-4 w-4 rounded border-primary accent-accent"
            />
            <Label htmlFor="lembrete-edit">✔ Ativar lembrete automático (WhatsApp)</Label>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/80 font-bold">
          {loading ? "Salvando..." : "✏️ Salvar Alterações"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EditPacienteDialog;
