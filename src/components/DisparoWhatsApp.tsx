import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DisparoWhatsAppProps {
  pacientes: any[];
}

const DisparoWhatsApp = ({ pacientes }: DisparoWhatsAppProps) => {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"lembrete" | "custom">("lembrete");

  const mensagemLembretePadrao = `Olá {nome}!👋\n\nEste é um lembrete de sua consulta marcada:\n\n📅 Data: {data}\n⏰ Horário: {horario}\n🦷 Procedimento: {procedimento}\n📍 Endereço: R. Guilherme Rocha 218, Edifício Jalcy Metrópole, Sala 902\n\nConfirme sua presença! 😊`;

  const [mensagemLembrete, setMensagemLembrete] = useState(mensagemLembretePadrao);
  const [mensagemCustom, setMensagemCustom] = useState("");

  const filtrados = useMemo(() => {
    if (!filtroStatus) return pacientes;
    return pacientes.filter((p) => p.status === filtroStatus);
  }, [pacientes, filtroStatus]);

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    if (selecionados.length === filtrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(filtrados.map((p) => p.id));
    }
  };

  const gerarMensagem = (p: any): string => {
    const template = tipoMensagem === "custom" ? mensagemCustom : mensagemLembrete;
    return template
      .replace(/{nome}/g, p.nome)
      .replace(/{telefone}/g, p.telefone)
      .replace(/{data}/g, p.data_agendamento || "")
      .replace(/{horario}/g, p.horario_agendamento || "")
      .replace(/{procedimento}/g, p.procedimentos || "")
      .replace(/{valor}/g, p.valor ? `R$ ${Number(p.valor).toFixed(2).replace(".", ",")}` : "")
      .replace(/{observacoes}/g, p.observacoes || "");
  };

  const enviarDisparo = () => {
    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos um paciente!");
      return;
    }

    const msgAtual = tipoMensagem === "custom" ? mensagemCustom : mensagemLembrete;
    if (!msgAtual.trim()) {
      toast.error("Digite a mensagem!");
      return;
    }

    const pacientesSelecionados = pacientes.filter((p) => selecionados.includes(p.id));
    let enviados = 0;

    pacientesSelecionados.forEach((p, index) => {
      const phone = p.telefone.replace(/\D/g, "");
      const msg = gerarMensagem(p);
      setTimeout(() => {
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
        enviados++;
        if (enviados === pacientesSelecionados.length) {
          toast.success(`${enviados} mensagem(ns) disparada(s)!`);
        }
      }, index * 1500);
    });
  };

  const selectClass = "w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground";

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-2xl font-bold">📨 Disparo WhatsApp</h2>

      {/* Filtros e tipo de mensagem */}
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Filtrar por Status</Label>
          <select
            className={selectClass + " mt-1"}
            value={filtroStatus}
            onChange={(e) => { setFiltroStatus(e.target.value); setSelecionados([]); }}
          >
            <option value="">Todos</option>
            <option value="Agendado">Agendado</option>
            <option value="Sem Interesse">Sem Interesse</option>
            <option value="Fechado">Fechado</option>
          </select>
        </div>
        <div>
          <Label>Tipo de Mensagem</Label>
          <select
            className={selectClass + " mt-1"}
            value={tipoMensagem}
            onChange={(e) => setTipoMensagem(e.target.value as "lembrete" | "custom")}
          >
            <option value="lembrete">Lembrete de Consulta</option>
            <option value="custom">Mensagem Personalizada</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button onClick={enviarDisparo} className="w-full bg-[hsl(142,70%,49%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(142,70%,40%)] font-bold">
            📨 Disparar ({selecionados.length})
          </Button>
        </div>
      </div>

      {/* Mensagem editável */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <Label>{tipoMensagem === "lembrete" ? "Mensagem de Lembrete" : "Mensagem Personalizada"}</Label>
          {tipoMensagem === "lembrete" && (
            <Button size="sm" variant="ghost" onClick={() => setMensagemLembrete(mensagemLembretePadrao)} className="text-xs text-muted-foreground">
              🔄 Restaurar padrão
            </Button>
          )}
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Variáveis: {"{nome}"}, {"{telefone}"}, {"{data}"}, {"{horario}"}, {"{procedimento}"}, {"{valor}"}, {"{observacoes}"}
        </p>
        <textarea
          className={selectClass + " mt-1 min-h-[120px]"}
          placeholder="Olá {nome}! Sua consulta está marcada para {data} às {horario}..."
          value={tipoMensagem === "lembrete" ? mensagemLembrete : mensagemCustom}
          onChange={(e) => tipoMensagem === "lembrete" ? setMensagemLembrete(e.target.value) : setMensagemCustom(e.target.value)}
        />
      </div>

      {/* Lista de pacientes */}
      {filtrados.length === 0 ? (
        <p className="mt-4 text-center text-muted-foreground">Nenhum paciente encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-primary/20">
          <table className="w-full">
            <thead>
              <tr className="bg-primary">
                <th className="p-3 text-left text-sm font-semibold text-primary-foreground">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selecionados.length === filtrados.length && filtrados.length > 0}
                      onCheckedChange={toggleTodos}
                    />
                    <span>Todos</span>
                  </div>
                </th>
                <th className="p-3 text-left text-sm font-semibold text-primary-foreground">Nome</th>
                <th className="p-3 text-left text-sm font-semibold text-primary-foreground">Telefone</th>
                <th className="p-3 text-left text-sm font-semibold text-primary-foreground">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-primary-foreground">Data Agend.</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-border transition-colors cursor-pointer ${
                    selecionados.includes(p.id) ? "bg-accent/20" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => toggleSelecionado(p.id)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selecionados.includes(p.id)}
                      onCheckedChange={() => toggleSelecionado(p.id)}
                    />
                  </td>
                  <td className="p-3 text-sm">{p.nome}</td>
                  <td className="p-3 text-sm">{p.telefone}</td>
                  <td className="p-3 text-sm">{p.status}</td>
                  <td className="p-3 text-sm">{p.data_agendamento || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        💡 Cada mensagem abrirá uma aba do WhatsApp Web. Intervalo de 1,5s entre cada envio.
      </p>
    </div>
  );
};

export default DisparoWhatsApp;

