import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import PacienteForm from "@/components/PacienteForm";
import PacienteTable from "@/components/PacienteTable";
import DisparoWhatsApp from "@/components/DisparoWhatsApp";
import PagamentoDialog from "@/components/PagamentoDialog";
import ReagendarDialog from "@/components/ReagendarDialog";
import EditPacienteDialog from "@/components/EditPacienteDialog";
import FloatingAgendamentos from "@/components/FloatingAgendamentos";

type Secao = "dashboard" | "novo-paciente" | "agendados" | "compareceu" | "sem-interesse" | "fechados" | "todos" | "disparo" | "financeiro";

const NAV_ITEMS: { id: Secao; label: string; icon: string }[] = [
  { id: "dashboard", label: "Painel", icon: "📊" },
  { id: "novo-paciente", label: "Novo Paciente", icon: "➕" },
  { id: "agendados", label: "Agendados", icon: "📅" },
  { id: "compareceu", label: "Compareceu", icon: "🏥" },
  { id: "sem-interesse", label: "Sem Interesse", icon: "❌" },
  { id: "fechados", label: "Fechados", icon: "✅" },
  { id: "financeiro", label: "Financeiro", icon: "💰" },
  { id: "todos", label: "Todos", icon: "📋" },
  { id: "disparo", label: "Disparo", icon: "📨" },
];

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [secao, setSecao] = useState<Secao>("dashboard");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  // Search state
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [buscaTexto, setBuscaTexto] = useState("");
  const buscaRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [pagamentoPaciente, setPagamentoPaciente] = useState<any>(null);
  const [reagendarPaciente, setReagendarPaciente] = useState<any>(null);
  const [editarPaciente, setEditarPaciente] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchPacientes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPacientes(data);
  }, [user]);

  useEffect(() => {
    if (user) fetchPacientes();
  }, [user, fetchPacientes]);

  const deletePaciente = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else { toast.success("Excluído!"); fetchPacientes(); }
  };

  const exportCSV = () => {
    let csv = "Nome,Telefone,Data Contato,Data Agendamento,Horário,Status,Valor,Mídia,Procedimento,Tipo Atendimento,Observações\n";
    pacientes.forEach((p) => {
      csv += `"${p.nome}","${p.telefone}","${p.data_contato || ""}","${p.data_agendamento || ""}","${p.horario_agendamento || ""}","${p.status}","${p.valor}","${p.midia || ""}","${p.procedimentos || ""}","${p.tipo_atendimento || ""}","${p.observacoes || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pacientes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const atualizarStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase.from("pacientes").update({ status: novoStatus }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status.");
    else { toast.success(`Status alterado para ${novoStatus}!`); fetchPacientes(); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={fetchPacientes} />;

  const agendados = pacientes.filter((p) => ["Agendado", "Remarcado"].includes(p.status));
  const compareceram = pacientes.filter((p) => p.status === "Compareceu");
  const semInteresse = pacientes.filter((p) => p.status === "Sem Interesse");
  const fechados = pacientes.filter((p) => p.status === "Fechado");

  let todosFiltrados = pacientes;
  if (filtroNome) todosFiltrados = todosFiltrados.filter((p) => p.nome.toLowerCase().includes(filtroNome.toLowerCase()));
  if (filtroStatus) todosFiltrados = todosFiltrados.filter((p) => p.status === filtroStatus);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-5 py-4">
        <h1 className="font-display text-xl font-bold text-primary-foreground sm:text-2xl">📋 MAGNATA DO CRM</h1>
        <div className="flex items-center gap-3">
          {buscaAberta ? (
            <div className="relative flex items-center">
              <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
              <input
                ref={buscaRef}
                autoFocus
                type="text"
                placeholder="Buscar paciente..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="h-9 w-48 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 pl-8 pr-8 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/40 sm:w-64"
              />
              <button
                onClick={() => { setBuscaAberta(false); setBuscaTexto(""); }}
                className="absolute right-2 text-primary-foreground/70 hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setBuscaAberta(true); setTimeout(() => buscaRef.current?.focus(), 100); }}
              className="rounded-md p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
              title="Buscar paciente"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          <span className="hidden text-sm text-primary-foreground/80 sm:inline">
            {user.user_metadata?.display_name || user.email}
          </span>
          <Button size="sm" variant="destructive" onClick={handleLogout} className="font-bold">
            Sair
          </Button>
        </div>
      </header>

      {/* Search Results Dropdown */}
      {buscaAberta && buscaTexto.length >= 2 && (() => {
        const resultados = pacientes.filter((p) =>
          p.nome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
          p.telefone.includes(buscaTexto)
        );
        return (
          <div className="absolute right-4 top-16 z-50 w-80 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl sm:w-96">
            <div className="p-2 text-xs font-semibold text-muted-foreground border-b border-border">
              {resultados.length} resultado(s)
            </div>
            {resultados.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
            ) : (
              resultados.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/80 transition-colors border-b border-border/50 last:border-0"
                  onClick={() => {
                    setEditarPaciente(p);
                    setBuscaAberta(false);
                    setBuscaTexto("");
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.telefone} · {p.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.tipo_atendimento || "-"}</span>
                </button>
              ))
            )}
          </div>
        );
      })()}

      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 bg-secondary p-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSecao(item.id)}
            className={`flex-1 min-w-[100px] rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
              secao === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/80"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-4 sm:p-6">
        {secao === "dashboard" && (
          <Dashboard pacientes={pacientes} mes={mes} ano={ano} onMesChange={setMes} onAnoChange={setAno} />
        )}

        {secao === "novo-paciente" && (
          <PacienteForm userId={user.id} onSaved={fetchPacientes} />
        )}

        {secao === "agendados" && (
          <div className="animate-fade-in">
            <h2 className="mb-2 font-display text-2xl font-bold">Pacientes Agendados</h2>
            <PacienteTable
              pacientes={agendados}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "telefone", label: "Telefone" },
                { key: "data_agendamento", label: "Data" },
                { key: "horario_agendamento", label: "Horário" },
                { key: "tipo_atendimento", label: "Tipo" },
                { key: "procedimentos", label: "Procedimento" },
                { key: "status", label: "Status" },
              ]}
              onDelete={deletePaciente}
              showWhatsApp
              onEditar={(p) => setEditarPaciente(p)}
              onReagendar={(p) => setReagendarPaciente(p)}
              onDarBaixa={(p) => setPagamentoPaciente(p)}
            />
          </div>
        )}

        {secao === "compareceu" && (
          <div className="animate-fade-in">
            <h2 className="mb-2 font-display text-2xl font-bold">🏥 Pacientes que Compareceram</h2>
            {compareceram.length === 0 ? (
              <p className="text-muted-foreground">Nenhum paciente com status "Compareceu".</p>
            ) : (
              <div className="space-y-3">
                {compareceram.map((p) => (
                  <div key={p.id} className="flex flex-col gap-3 rounded-xl border-2 border-primary/20 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <p className="text-lg font-bold">{p.nome}</p>
                      <p className="text-sm text-muted-foreground">{p.telefone} · {p.tipo_atendimento || "-"} · {p.procedimentos || "-"}</p>
                      <p className="text-sm text-muted-foreground">Valor: <span className="font-semibold text-foreground">R$ {Number(p.valor).toFixed(2).replace(".", ",")}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        onClick={async () => {
                          await atualizarStatus(p.id, "Fechado");
                          setPagamentoPaciente(p);
                        }}
                      >
                        ✅ Fechou
                      </Button>
                      <Button
                        variant="destructive"
                        className="font-bold"
                        onClick={() => atualizarStatus(p.id, "Sem Interesse")}
                      >
                        ❌ Não Fechou
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditarPaciente(p)}
                      >
                        ✏️ Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {secao === "sem-interesse" && (
          <div className="animate-fade-in">
            <h2 className="mb-2 font-display text-2xl font-bold">Sem Interesse</h2>
            <PacienteTable
              pacientes={semInteresse}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "telefone", label: "Telefone" },
                { key: "data_contato", label: "Data Contato" },
                { key: "midia", label: "Mídia" },
              ]}
              onDelete={deletePaciente}
              onEditar={(p) => setEditarPaciente(p)}
            />
          </div>
        )}

        {secao === "fechados" && (
          <div className="animate-fade-in">
            <h2 className="mb-2 font-display text-2xl font-bold">Fechados</h2>
            <PacienteTable
              pacientes={fechados}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "telefone", label: "Telefone" },
                { key: "procedimentos", label: "Procedimento" },
                { key: "valor", label: "Valor", render: (p) => `R$ ${Number(p.valor).toFixed(2).replace(".", ",")}` },
                { key: "data_agendamento", label: "Data" },
              ]}
              onDelete={deletePaciente}
              onEditar={(p) => setEditarPaciente(p)}
              onDarBaixa={(p) => setPagamentoPaciente(p)}
            />
          </div>
        )}

        {secao === "financeiro" && (
          <div className="animate-fade-in">
            <h2 className="mb-4 font-display text-2xl font-bold">💰 Módulo Financeiro</h2>
            <PacienteTable
              pacientes={pacientes.filter((p) => p.valor > 0)}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "procedimentos", label: "Procedimento" },
                { key: "valor", label: "Valor", render: (p) => `R$ ${Number(p.valor).toFixed(2).replace(".", ",")}` },
                { key: "status", label: "Status" },
                { key: "data_agendamento", label: "Data" },
              ]}
              onDelete={deletePaciente}
              onEditar={(p) => setEditarPaciente(p)}
              onDarBaixa={(p) => setPagamentoPaciente(p)}
            />
          </div>
        )}

        {secao === "disparo" && (
          <DisparoWhatsApp pacientes={pacientes} />
        )}

        {secao === "todos" && (
          <div className="animate-fade-in">
            <h2 className="mb-4 font-display text-2xl font-bold">Todos os Pacientes</h2>
            <div className="mb-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Filtrar por nome</label>
                <Input className="bg-secondary border-primary/30" placeholder="Digite o nome..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Filtrar por Status</label>
                <select className="w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Compareceu">Compareceu</option>
                  <option value="Faltou">Faltou</option>
                  <option value="Remarcado">Remarcado</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Sem Interesse">Sem Interesse</option>
                  <option value="Fechado">Fechado</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={exportCSV} className="bg-accent text-accent-foreground hover:bg-accent/80 font-bold">
                  📥 Exportar CSV
                </Button>
              </div>
            </div>
            <PacienteTable
              pacientes={todosFiltrados}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "telefone", label: "Telefone" },
                { key: "status", label: "Status" },
                { key: "tipo_atendimento", label: "Tipo" },
                { key: "data_agendamento", label: "Data Agend." },
                { key: "procedimentos", label: "Procedimento" },
                { key: "valor", label: "Valor", render: (p) => `R$ ${Number(p.valor).toFixed(2).replace(".", ",")}` },
              ]}
              onDelete={deletePaciente}
              onEditar={(p) => setEditarPaciente(p)}
              onReagendar={(p) => setReagendarPaciente(p)}
              onDarBaixa={(p) => setPagamentoPaciente(p)}
            />
          </div>
        )}
      </main>

      {/* Dialogs */}
      <PagamentoDialog
        open={!!pagamentoPaciente}
        onClose={() => setPagamentoPaciente(null)}
        paciente={pagamentoPaciente}
        userId={user.id}
        onSaved={fetchPacientes}
      />
      <ReagendarDialog
        open={!!reagendarPaciente}
        onClose={() => setReagendarPaciente(null)}
        paciente={reagendarPaciente}
        userId={user.id}
        onSaved={fetchPacientes}
      />
      <EditPacienteDialog
        open={!!editarPaciente}
        onClose={() => setEditarPaciente(null)}
        paciente={editarPaciente}
        onSaved={fetchPacientes}
        onOpenPagamento={(p) => setPagamentoPaciente(p)}
      />
      <FloatingAgendamentos pacientes={pacientes} onRefresh={fetchPacientes} onOpenPagamento={(p) => setPagamentoPaciente(p)} />
    </div>
  );
};

export default Index;
