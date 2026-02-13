import { useMemo } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <div className="rounded-xl border-2 border-primary/20 bg-primary/10 p-5 text-center transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
    <div className="mb-1 text-2xl">{icon}</div>
    <h3 className="text-sm text-muted-foreground">{title}</h3>
    <div className="mt-1 font-display text-2xl font-bold text-accent">{value}</div>
  </div>
);

interface DashboardProps {
  pacientes: any[];
  mes: number;
  ano: number;
  onMesChange: (m: number) => void;
  onAnoChange: (a: number) => void;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const Dashboard = ({ pacientes, mes, ano, onMesChange, onAnoChange }: DashboardProps) => {
  const stats = useMemo(() => {
    const filtrados = pacientes.filter((p) => {
      if (!p.data_agendamento) return false;
      const d = new Date(p.data_agendamento);
      return d.getMonth() + 1 === mes && d.getFullYear() === ano;
    });
    const agendados = filtrados.filter((p) => p.status === "Agendado").length;
    const semInteresse = filtrados.filter((p) => p.status === "Sem Interesse").length;
    const fechados = filtrados.filter((p) => p.status === "Fechado").length;
    const faturamento = filtrados
      .filter((p) => p.status === "Fechado")
      .reduce((s, p) => s + (Number(p.valor) || 0), 0);
    return { total: filtrados.length, agendados, semInteresse, fechados, faturamento };
  }, [pacientes, mes, ano]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold">Painel de Controle</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Mês</label>
          <select
            value={mes}
            onChange={(e) => onMesChange(Number(e.target.value))}
            className="w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Ano</label>
          <select
            value={ano}
            onChange={(e) => onAnoChange(Number(e.target.value))}
            className="w-full rounded-lg border border-primary/30 bg-secondary p-2.5 text-foreground"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Total de Leads" value={stats.total} icon="📊" />
        <StatCard title="Agendados" value={stats.agendados} icon="📅" />
        <StatCard title="Sem Interesse" value={stats.semInteresse} icon="❌" />
        <StatCard title="Fechados" value={stats.fechados} icon="✅" />
        <StatCard title="Faturamento" value={`R$ ${stats.faturamento.toFixed(2).replace(".", ",")}`} icon="💰" />
      </div>
    </div>
  );
};

export default Dashboard;
