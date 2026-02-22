import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

interface FloatingAgendamentosProps {
  pacientes: any[];
  onRefresh?: () => void;
}

const FloatingAgendamentos = ({ pacientes, onRefresh }: FloatingAgendamentosProps) => {
  const [open, setOpen] = useState(false);
  const [indice, setIndice] = useState(0);
  const [pagamentos, setPagamentos] = useState<Record<string, any>>({});
  const [showCompareceuDialog, setShowCompareceuDialog] = useState(false);
  const [compareceuPaciente, setCompareceuPaciente] = useState<any>(null);

  useEffect(() => {
    const fetchPagamentos = async () => {
      const ids = pacientes.map((p) => p.id);
      if (ids.length === 0) return;
      const { data } = await supabase
        .from("pagamentos")
        .select("*")
        .in("paciente_id", ids);
      if (data) {
        const map: Record<string, any> = {};
        data.forEach((pg) => { map[pg.paciente_id] = pg; });
        setPagamentos(map);
      }
    };
    fetchPagamentos();
  }, [pacientes]);

  const amanha = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const hoje = useMemo(() => new Date().toISOString().split("T")[0], []);

  const isRelevant = (p: any) =>
    ["Agendado", "Remarcado"].includes(p.status);

  const agendamentosAmanha = useMemo(
    () => pacientes.filter((p) => p.data_agendamento === amanha && isRelevant(p)),
    [pacientes, amanha]
  );

  const agendamentosHoje = useMemo(
    () => pacientes.filter((p) => p.data_agendamento === hoje && isRelevant(p)),
    [pacientes, hoje]
  );

  const todos = [...agendamentosHoje, ...agendamentosAmanha];
  const total = todos.length;

  // Reset index when list changes
  useEffect(() => {
    if (indice >= total) setIndice(Math.max(0, total - 1));
  }, [total, indice]);

  if (total === 0) return null;

  const atual = todos[indice];
  const isHoje = atual?.data_agendamento === hoje;

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const sendWhatsApp = (p: any) => {
    const phone = p.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank");
  };


  const handleCompareceu = (p: any) => {
    setCompareceuPaciente(p);
    setShowCompareceuDialog(true);
  };

  const handleCompareceuChoice = async (fechou: boolean) => {
    if (!compareceuPaciente) return;
    const novoStatus = fechou ? "Fechado" : "Sem Interesse";
    const { error } = await supabase
      .from("pacientes")
      .update({ status: novoStatus })
      .eq("id", compareceuPaciente.id);
    setShowCompareceuDialog(false);
    setCompareceuPaciente(null);
    if (error) {
      toast.error("Erro ao atualizar status.");
    } else {
      toast.success(fechou ? "Marcado como Fechado ✅" : "Marcado como Sem Interesse ❌");
      onRefresh?.();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 transition-all animate-bounce"
            style={{ animationDuration: "2s" }}
          >
            <span className="text-2xl">🔔</span>
            {total > 0 && (
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {total}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">🔔 Próximos Agendamentos</SheetTitle>
          </SheetHeader>

          {atual && (
            <div className="mt-4 space-y-4">
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={indice === 0}
                  onClick={() => setIndice((i) => i - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm font-bold text-muted-foreground">
                  {indice + 1} / {total}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={indice === total - 1}
                  onClick={() => setIndice((i) => i + 1)}
                  className="gap-1"
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day label */}
              <h3 className="text-lg font-bold text-primary">
                📅 {isHoje ? "Hoje" : "Amanhã"} — {formatDate(atual.data_agendamento)}
              </h3>

              {/* Patient card */}
              <CardPaciente
                p={atual}
                pagamento={pagamentos[atual.id]}
                formatDate={formatDate}
                onWhatsApp={sendWhatsApp}
                onCompareceu={handleCompareceu}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showCompareceuDialog} onOpenChange={setShowCompareceuDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🏥 Paciente compareceu!</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              O paciente <span className="font-bold">{compareceuPaciente?.nome}</span> compareceu. Ele fechou o procedimento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-center">
            <Button
              className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-[hsl(0,0%,100%)] font-bold text-base px-6"
              onClick={() => handleCompareceuChoice(true)}
            >
              ✅ Sim, Fechou!
            </Button>
            <Button
              variant="destructive"
              className="font-bold text-base px-6"
              onClick={() => handleCompareceuChoice(false)}
            >
              ❌ Não Fechou
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const tipoIcon = (tipo: string) => {
  switch (tipo) {
    case "Prova da prótese": return "🔍";
    case "Entrega da prótese": return "📦";
    case "Ajuste pós-entrega": return "🔧";
    case "Avaliação": return "📋";
    case "Retorno comum": return "🔄";
    default: return "🏥";
  }
};

const CardPaciente = ({ p, pagamento, formatDate, onWhatsApp, onCompareceu }: { p: any; pagamento?: any; formatDate: (d: string) => string; onWhatsApp: (p: any) => void; onCompareceu?: (p: any) => void }) => {
  const valorTotal = Number(p.valor) || 0;
  const valorPago = pagamento ? Number(pagamento.valor_pago) || 0 : 0;
  const valorRestante = valorTotal - valorPago;
  const statusPag = pagamento?.status_pagamento || (valorTotal > 0 ? "Pendente" : null);

  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground text-base">{p.nome}</h4>
        <Badge variant="outline" className="border-accent text-accent text-xs">{p.status}</Badge>
      </div>
      {p.tipo_atendimento && (
        <div className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          {tipoIcon(p.tipo_atendimento)} {p.tipo_atendimento}
        </div>
      )}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>📞 <span className="text-foreground font-medium">{p.telefone}</span></p>
        <p>📅 Data: <span className="text-foreground font-medium">{p.data_agendamento ? formatDate(p.data_agendamento) : "Não definida"}</span></p>
        <p>⏰ Horário: <span className="text-foreground font-medium">{p.horario_agendamento || "Não definido"}</span></p>
        <p>🦷 Procedimento: <span className="text-foreground font-medium">{p.procedimentos || "Não informado"}</span></p>
        {p.midia && <p>📱 Mídia: <span className="text-foreground font-medium">{p.midia}</span></p>}
        {p.observacoes && <p>📝 Obs: <span className="text-foreground font-medium">{p.observacoes}</span></p>}
      </div>

      {/* Resumo Financeiro */}
      {valorTotal > 0 && (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
          <p className="text-sm font-bold text-primary">💰 Resumo Financeiro</p>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="text-foreground font-semibold text-right">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
            <span className="text-muted-foreground">Valor Pago:</span>
            <span className="text-foreground font-semibold text-right text-[hsl(142,70%,49%)]">R$ {valorPago.toFixed(2).replace(".", ",")}</span>
            <span className="text-muted-foreground font-bold">Faltando:</span>
            <span className={`font-bold text-right ${valorRestante > 0 ? "text-destructive" : "text-[hsl(142,70%,49%)]"}`}>
              R$ {valorRestante.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {statusPag && (
            <Badge variant={statusPag === "Pago" ? "default" : "destructive"} className="mt-1 text-xs">
              {statusPag === "Pago" ? "✅ Pago" : statusPag === "Parcial" ? "⚠️ Parcial" : "🔴 Pendente"}
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={() => onWhatsApp(p)} className="flex-1 bg-[hsl(142,70%,49%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(142,70%,40%)] text-xs font-bold">
          📲 WhatsApp
        </Button>
        {onCompareceu && (
          <Button size="sm" onClick={() => onCompareceu(p)} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 text-xs font-bold">
            🏥 Compareceu
          </Button>
        )}
      </div>
    </div>
  );
};

export default FloatingAgendamentos;
