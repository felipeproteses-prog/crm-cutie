import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PagamentoDialogProps {
  open: boolean;
  onClose: () => void;
  paciente: any;
  userId: string;
  onSaved: () => void;
}

const PagamentoDialog = ({ open, onClose, paciente, userId, onSaved }: PagamentoDialogProps) => {
  const [valorPago, setValorPago] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pagamentoExistente, setPagamentoExistente] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && paciente) {
      fetchPagamento();
    }
  }, [open, paciente]);

  const fetchPagamento = async () => {
    const { data } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("paciente_id", paciente.id)
      .maybeSingle();
    setPagamentoExistente(data);
    setValorPago("");
    setObservacoes("");
  };

  const handleDarBaixa = async () => {
    const valor = parseFloat(valorPago);
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setLoading(true);

    if (pagamentoExistente) {
      const novoValorPago = pagamentoExistente.valor_pago + valor;
      const novoStatus =
        novoValorPago >= pagamentoExistente.valor_total ? "Pago" : "Parcial";

      const { error } = await supabase
        .from("pagamentos")
        .update({
          valor_pago: novoValorPago,
          status_pagamento: novoStatus,
          data_pagamento: new Date().toISOString(),
          observacoes: observacoes || pagamentoExistente.observacoes,
        })
        .eq("id", pagamentoExistente.id);

      if (error) {
        toast.error("Erro ao atualizar pagamento.");
      } else {
        toast.success(`Pagamento registrado! Status: ${novoStatus}`);
        onSaved();
        onClose();
      }
    } else {
      const valorTotal = paciente.valor || 0;
      const novoStatus = valor >= valorTotal ? "Pago" : "Parcial";

      const { error } = await supabase.from("pagamentos").insert({
        paciente_id: paciente.id,
        user_id: userId,
        valor_total: valorTotal,
        valor_pago: valor,
        status_pagamento: novoStatus,
        data_pagamento: new Date().toISOString(),
        observacoes: observacoes || null,
      });

      if (error) {
        toast.error("Erro ao registrar pagamento.");
      } else {
        toast.success(`Pagamento registrado! Status: ${novoStatus}`);
        onSaved();
        onClose();
      }
    }
    setLoading(false);
  };

  if (!paciente) return null;

  const valorTotal = pagamentoExistente?.valor_total ?? paciente.valor ?? 0;
  const jaPago = pagamentoExistente?.valor_pago ?? 0;
  const restante = valorTotal - jaPago;
  const statusAtual = pagamentoExistente?.status_pagamento ?? "Pendente";

  const statusColor =
    statusAtual === "Pago"
      ? "text-green-500"
      : statusAtual === "Parcial"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>💰 Dar Baixa - {paciente.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary p-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold">R$ {Number(valorTotal).toFixed(2).replace(".", ",")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Já Pago</p>
              <p className="text-lg font-bold text-green-500">R$ {Number(jaPago).toFixed(2).replace(".", ",")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="text-lg font-bold text-red-500">R$ {Number(restante).toFixed(2).replace(".", ",")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`text-lg font-bold ${statusColor}`}>{statusAtual}</p>
            </div>
          </div>

          {statusAtual !== "Pago" && (
            <>
              <div>
                <Label>Valor do Pagamento (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Máx: R$ ${restante.toFixed(2)}`}
                  className="mt-1 bg-secondary border-primary/30"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground min-h-[60px]"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Pagou via PIX"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setValorPago(restante.toFixed(2))}
                  variant="outline"
                  className="flex-1"
                >
                  Pagar Total (R$ {restante.toFixed(2).replace(".", ",")})
                </Button>
                <Button
                  onClick={handleDarBaixa}
                  disabled={loading}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 font-bold"
                >
                  {loading ? "Salvando..." : "💰 Confirmar"}
                </Button>
              </div>
            </>
          )}

          {statusAtual === "Pago" && (
            <p className="text-center font-bold text-green-500">✅ Pagamento concluído!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PagamentoDialog;
