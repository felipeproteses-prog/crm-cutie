import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const email = username.includes("@") ? username : `${username}@magnatacrm.com`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Usuário ou senha inválidos!");
      } else {
        onLogin();
      }
    } catch {
      toast.error("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md animate-fade-in rounded-xl border-2 border-primary/30 bg-card p-10 shadow-2xl shadow-primary/10">
        <h1 className="mb-2 text-center font-display text-3xl font-bold text-foreground">
          📋 MAGNATA DO CRM
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Gerenciador de Pacientes e Agendamentos
        </p>
        <div className="space-y-4">
          <div>
            <Label>Usuário</Label>
            <Input
              placeholder="felipe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mt-1 bg-secondary border-primary/30"
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mt-1 bg-secondary border-primary/30"
            />
          </div>
          <Button onClick={handleLogin} disabled={loading} className="w-full text-base font-bold">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
