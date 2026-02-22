import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FloatingAgendamentosProps {
  pacientes: any[];
}

const FloatingAgendamentos = ({ pacientes }: FloatingAgendamentosProps) => {
  const [open, setOpen] = useState(false);
  const [pagamentos, setPagamentos] = useState<Record<string, any>>({});

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

  if (total === 0) return null;

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const sendWhatsApp = (p: any) => {
    const phone = p.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank");
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

          <div className="mt-4 space-y-6">
            {agendamentosHoje.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-primary">📅 Hoje — {formatDate(hoje)}</h3>
                <div className="space-y-3">
                  {agendamentosHoje.map((p) => (
                    <CardPaciente key={p.id} p={p} pagamento={pagamentos[p.id]} formatDate={formatDate} onWhatsApp={sendWhatsApp} />
                  ))}
                </div>
              </div>
            )}

            {agendamentosAmanha.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-bold text-primary">📅 Amanhã — {formatDate(amanha)}</h3>
                <div className="space-y-3">
                  {agendamentosAmanha.map((p) => (
                    <CardPaciente key={p.id} p={p} pagamento={pagamentos[p.id]} formatDate={formatDate} onWhatsApp={sendWhatsApp} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
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

const CardPaciente = ({ p, pagamento, formatDate, onWhatsApp }: { p: any; pagamento?: any; formatDate: (d: string) => string; onWhatsApp: (p: any) => void }) => {
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

      <Button size="sm" onClick={() => onWhatsApp(p)} className="mt-2 w-full bg-[hsl(142,70%,49%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(142,70%,40%)] text-xs font-bold">
        📲 Abrir WhatsApp
      </Button>
    </div>
  );
};

export default FloatingAgendamentos;
