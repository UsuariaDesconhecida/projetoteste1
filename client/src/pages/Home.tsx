import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Package, 
  ClipboardList, 
  ShieldAlert, 
  BarChart3, 
  ArrowUpDown, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  AlertTriangle, 
  FileText,
  Search,
  Lock,
  Boxes
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AREAS = [
  "Compras",
  "Controladoria",
  "Diretoria",
  "Engenharia",
  "HSE",
  "Injeção",
  "IT",
  "Logística",
  "Manutenção",
  "Material Ledger",
  "Montagem",
  "Pintura",
  "Qualidade",
  "RH",
  "Vendas"
];

export default function Home() {
  const { user, refresh } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState("requisicao");

  // Formulário de Nova Requisição
  const [reqRequester, setReqRequester] = useState("");
  const [reqArea, setReqArea] = useState("");
  const [reqItemId, setReqItemId] = useState("");
  const [reqQuantity, setReqQuantity] = useState("1");
  const [reqJustification, setReqJustification] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // Modal de Aprovação/Recusa
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [adminObs, setAdminObs] = useState("");

  // Modal de Entrada/Saída de Estoque
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItemId, setStockItemId] = useState("");
  const [stockType, setStockType] = useState<"entrada" | "saida">("entrada");
  const [stockQty, setStockQty] = useState("1");
  const [stockReason, setStockReason] = useState("");

  // Modal de Novo Item no Catálogo
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("EPI");
  const [newItemUnit, setNewItemUnit] = useState("un");
  const [newItemStock, setNewItemStock] = useState("0");
  const [newItemMinStock, setNewItemMinStock] = useState("5");

  // Queries tRPC
  const catalogQuery = trpc.catalog.list.useQuery();
  const isAdmin = user?.role === 'admin';

  const requisitionsQuery = trpc.requisition.list.useQuery(undefined, { enabled: isAdmin });
  const statsQuery = trpc.stock.stats.useQuery(undefined, { enabled: isAdmin });
  const movementsQuery = trpc.stock.movements.useQuery(undefined, { enabled: isAdmin });

  const createReqMutation = trpc.requisition.create.useMutation({
    onSuccess: () => {
      toast.success("Requisição enviada com sucesso! O almoxarifado irá avaliá-la.");
      setReqRequester("");
      setReqArea("");
      setReqItemId("");
      setReqQuantity("1");
      setReqJustification("");
      setItemSearch("");
    },
    onError: (err) => {
      toast.error("Erro ao enviar requisição: " + err.message);
    }
  });

  const updateStatusMutation = trpc.requisition.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Requisição atualizada com sucesso!");
      setEvalModalOpen(false);
      setSelectedReqId(null);
      setAdminObs("");
      requisitionsQuery.refetch();
      statsQuery.refetch();
      catalogQuery.refetch();
      movementsQuery.refetch();
    },
    onError: (err) => {
      toast.error("Erro ao atualizar requisição: " + err.message);
    }
  });

  const stockMoveMutation = trpc.stock.move.useMutation({
    onSuccess: () => {
      toast.success("Movimentação de estoque registrada com sucesso!");
      setStockModalOpen(false);
      setStockReason("");
      setStockQty("1");
      catalogQuery.refetch();
      statsQuery.refetch();
      movementsQuery.refetch();
    },
    onError: (err) => {
      toast.error("Erro: " + err.message);
    }
  });

  const createItemMutation = trpc.catalog.create.useMutation({
    onSuccess: () => {
      toast.success("Item cadastrado com sucesso no catálogo!");
      setItemModalOpen(false);
      setNewItemCode("");
      setNewItemName("");
      setNewItemStock("0");
      catalogQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => {
      toast.error("Erro ao cadastrar item: " + err.message);
    }
  });

  const customLoginMutation = trpc.auth.customLogin.useMutation({
    onSuccess: () => {
      toast.success("Login de Administrador efetuado com sucesso!");
      refresh();
      setActiveTab("dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Credenciais inválidas");
    }
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Sessão encerrada.");
      refresh();
      setActiveTab("requisicao");
    }
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    customLoginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqItemId) {
      toast.error("Selecione um item válido do catálogo.");
      return;
    }
    createReqMutation.mutate({
      requesterName: reqRequester,
      area: reqArea,
      itemId: parseInt(reqItemId),
      quantity: parseInt(reqQuantity),
      justification: reqJustification,
    });
  };

  const filteredCatalog = (catalogQuery.data || []).filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar Corporativa */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 text-white p-2 rounded-xl font-bold tracking-wider flex items-center shadow-md">
            <Boxes className="w-6 h-6 mr-2" />
            <span className="text-lg">FORVIA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
              Almoxarifado & Gestão de EPIs
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                Corporativo
              </span>
            </h1>
            <p className="text-xs text-slate-400">Sistema Integrado de Requisições e Controle de Estoque</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && user.role === 'admin' ? (
            <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <div className="text-right">
                <p className="text-xs font-medium text-white">{user.name || "Administrador"}</p>
                <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Administrador</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logoutMutation.mutate()} 
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200">
                  <Lock className="w-4 h-4 mr-2 text-red-500" />
                  Área do Administrador
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-red-500" />
                    Login do Administrador
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Insira as credenciais de acesso restrito do almoxarifado.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLoginSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Usuário</Label>
                    <Input 
                      placeholder="almoxadm" 
                      value={loginEmail} 
                      onChange={e => setLoginEmail(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Senha</Label>
                    <Input 
                      type="password" 
                      placeholder="admsuporte" 
                      value={loginPassword} 
                      onChange={e => setLoginPassword(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white"
                      required 
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                      Entrar como Administrador
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      {/* Conteúdo Principal com Abas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Barra de Abas / Navegação baseada no perfil */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setActiveTab("requisicao")}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === "requisicao" 
                ? "border-red-500 text-red-400 bg-red-500/10 rounded-t-lg" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Nova Requisição</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("catalogo")}
                className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "catalogo" 
                    ? "border-red-500 text-red-400 bg-red-500/10 rounded-t-lg" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Catálogo & Gestão</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "dashboard" 
                    ? "border-red-500 text-red-400 bg-red-500/10 rounded-t-lg" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Painel Gerencial</span>
              </button>

              <button
                onClick={() => setActiveTab("estoque")}
                className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center space-x-2 ${
                  activeTab === "estoque" 
                    ? "border-red-500 text-red-400 bg-red-500/10 rounded-t-lg" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Estoque & Movimentações</span>
              </button>
            </>
          )}
        </div>

        {/* TAB 1: NOVA REQUISIÇÃO (Perfil Solicitante e Geral) */}
        {activeTab === "requisicao" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-red-500" />
                    Solicitação de Material ou EPI
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Preencha os campos abaixo para requisitar itens do almoxarifado corporativo Forvia.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReqSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Nome do Solicitante *</Label>
                        <Input 
                          placeholder="Digite seu nome completo" 
                          value={reqRequester}
                          onChange={e => setReqRequester(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-white"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Área / Setor *</Label>
                        <Select value={reqArea} onValueChange={setReqArea} required>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            {AREAS.map(area => (
                              <SelectItem key={area} value={area}>{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Item Solicitado (Catálogo) *</Label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <Input 
                            placeholder="Buscar item por nome ou código..." 
                            value={itemSearch}
                            onChange={e => setItemSearch(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white pl-9"
                          />
                        </div>
                        <Select value={reqItemId} onValueChange={setReqItemId} required>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                            <SelectValue placeholder="Selecione o item no catálogo" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-60">
                            {filteredCatalog.map(item => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.code} - {item.name} (Estoque: {item.stock} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Quantidade *</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          value={reqQuantity}
                          onChange={e => setReqQuantity(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Justificativa / Motivo *</Label>
                      <Textarea 
                        placeholder="Informe o motivo da requisição (ex: Troca de EPI vencido, Manutenção preventiva...)" 
                        value={reqJustification}
                        onChange={e => setReqJustification(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white min-h-[100px]"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3">
                      Enviar Requisição ao Almoxarifado
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Painel lateral informativo */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
                    Diretrizes de Requisição
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-300">
                  <p>
                    • Conforme as normas Forvia, o solicitante possui acesso restrito exclusivamente ao envio de novas requisições.
                  </p>
                  <p>
                    • O saldo em estoque é atualizado automaticamente no momento da aprovação pelo administrador.
                  </p>
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-400">Acesso Restrito do Administrador:</p>
                    <p className="text-xs text-red-400 font-mono mt-1">Usuário: almoxadm | Senha: admsuporte</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: CATÁLOGO DE MATERIAIS & EPIS (Apenas Admin) */}
        {activeTab === "catalogo" && isAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Catálogo de Materiais e EPIs</h2>
                <p className="text-slate-400 text-sm">Lista oficial de itens disponíveis no almoxarifado Forvia.</p>
              </div>
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Pesquisar no catálogo..." 
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white pl-9"
                  />
                </div>
                <Button onClick={() => setItemModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Novo Item
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map(item => {
                const isLow = item.stock <= item.minStock;
                return (
                  <Card key={item.id} className="bg-slate-900 border-slate-800 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-slate-400 border-slate-700 font-mono text-xs">
                          {item.code}
                        </Badge>
                        <Badge className={item.category === 'EPI' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}>
                          {item.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-white mt-2">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-slate-400">Estoque Atual</p>
                          <p className={`text-2xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                            {item.stock} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
                          </p>
                        </div>
                        {isLow && (
                          <div className="flex items-center space-x-1 text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/30 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Baixo</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Estoque mínimo recomendado: {item.minStock} {item.unit}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PAINEL DO ADMINISTRADOR (KPIs, Gráficos por Área e Item, Gestão de Requisições) */}
        {activeTab === "dashboard" && isAdmin && statsQuery.data && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Painel Gerencial do Administrador</h2>
                <p className="text-slate-400 text-sm">Visão geral das requisições, indicadores de estoque e consumo por área e item.</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-300">Requisições Pendentes</CardTitle>
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{statsQuery.data.pendingReqs}</div>
                  <p className="text-xs text-slate-400 mt-1">Aguardando aprovação ou recusa</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-300">Itens com Estoque Baixo</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">{statsQuery.data.lowStockCount}</div>
                  <p className="text-xs text-slate-400 mt-1">Abaixo do limite mínimo recomendado</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-300">Total de Itens no Catálogo</CardTitle>
                  <Package className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{statsQuery.data.totalItems}</div>
                  <p className="text-xs text-slate-400 mt-1">Materiais e EPIs cadastrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos de Consumo por Área e por Item */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-red-500" />
                    Consumo por Área / Setor (Requisições Aprovadas)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {statsQuery.data.areaConsumption.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsQuery.data.areaConsumption}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="area" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} 
                        />
                        <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                      Nenhum dado de consumo por área registrado ainda.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-red-500" />
                    Top Itens mais Solicitados (Requisições Aprovadas)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {statsQuery.data.itemConsumption.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsQuery.data.itemConsumption}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} 
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                      Nenhum dado de consumo por item registrado ainda.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gerenciamento de Requisições */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-red-500" />
                  Gerenciamento de Todas as Requisições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-950">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">ID / Solicitante</TableHead>
                        <TableHead className="text-slate-300">Item / Qtd</TableHead>
                        <TableHead className="text-slate-300">Justificativa</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300 text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(requisitionsQuery.data || []).map(req => (
                        <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell>
                            <p className="font-bold text-white">#{req.id} - {req.requesterName}</p>
                            <p className="text-xs text-slate-400">{req.area}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-white">{req.itemName}</p>
                            <p className="text-xs font-semibold text-red-400">{req.quantity} {req.itemUnit}</p>
                          </TableCell>
                          <TableCell className="text-xs text-slate-300 max-w-xs truncate">{req.justification}</TableCell>
                          <TableCell>
                            <Badge className={
                              req.status === 'aprovada' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              req.status === 'recusada' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }>
                              {req.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {req.status === 'pendente' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
                                onClick={() => {
                                  setSelectedReqId(req.id);
                                  setEvalModalOpen(true);
                                }}
                              >
                                Avaliar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: CONTROLE DE ESTOQUE & MOVIMENTAÇÕES (Apenas Admin) */}
        {activeTab === "estoque" && isAdmin && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Controle de Estoque e Movimentações</h2>
                <p className="text-slate-400 text-sm">Registre entradas de novos materiais ou saídas manuais e acompanhe o histórico.</p>
              </div>
              <Button onClick={() => setStockModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" /> Registrar Entrada / Saída
              </Button>
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center">
                  <ArrowUpDown className="w-5 h-5 mr-2 text-red-500" />
                  Histórico de Movimentações de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">Data / Hora</TableHead>
                        <TableHead className="text-slate-300">Tipo</TableHead>
                        <TableHead className="text-slate-300">Item</TableHead>
                        <TableHead className="text-slate-300">Quantidade</TableHead>
                        <TableHead className="text-slate-300">Motivo / Descrição</TableHead>
                        <TableHead className="text-slate-300">Responsável</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(movementsQuery.data || []).map(mov => (
                        <TableRow key={mov.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-xs text-slate-400">
                            {new Date(mov.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={mov.type === 'entrada' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {mov.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-white">
                            {mov.itemName} <span className="text-xs font-normal text-slate-400">({mov.itemCode})</span>
                          </TableCell>
                          <TableCell className="font-bold text-white">
                            {mov.type === 'entrada' ? '+' : '-'}{mov.quantity} {mov.itemUnit}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs">{mov.reason}</TableCell>
                          <TableCell className="text-slate-400 text-xs">{mov.responsible}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* Modal de Avaliação de Requisição (Aprovar / Recusar) */}
      <Dialog open={evalModalOpen} onOpenChange={setEvalModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Avaliar Requisição #{selectedReqId}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Aprovar a requisição baixará automaticamente o estoque do item correspondente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold text-slate-300">Observações do Administrador</Label>
              <Textarea 
                placeholder="Insira observações opcionais..." 
                value={adminObs} 
                onChange={e => setAdminObs(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                if (selectedReqId) {
                  updateStatusMutation.mutate({ id: selectedReqId, status: 'recusada', adminObservation: adminObs });
                }
              }}
            >
              <XCircle className="w-4 h-4 mr-2" /> Recusar
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={() => {
                if (selectedReqId) {
                  updateStatusMutation.mutate({ id: selectedReqId, status: 'aprovada', adminObservation: adminObs });
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar e Baixar Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Movimentação Manual de Estoque (Entrada/Saída) */}
      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação de Estoque</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adicione novos lotes ou registre saídas manuais de materiais e EPIs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold text-slate-300">Item do Catálogo</Label>
              <Select value={stockItemId} onValueChange={setStockItemId}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Selecione o item" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-60">
                  {(catalogQuery.data || []).map(item => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.code} - {item.name} (Atual: {item.stock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Tipo de Movimento</Label>
                <Select value={stockType} onValueChange={(val: any) => setStockType(val)}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="entrada">Entrada (Aumentar)</SelectItem>
                    <SelectItem value="saida">Saída (Diminuir)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Quantidade</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={stockQty} 
                  onChange={e => setStockQty(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold text-slate-300">Motivo / Nota Fiscal / Justificativa</Label>
              <Textarea 
                placeholder="Ex: Nota Fiscal nº 45890 de compra de fornecedor..." 
                value={stockReason} 
                onChange={e => setStockReason(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => {
                if (!stockItemId) {
                  toast.error("Selecione um item.");
                  return;
                }
                stockMoveMutation.mutate({
                  itemId: parseInt(stockItemId),
                  type: stockType,
                  quantity: parseInt(stockQty),
                  reason: stockReason || "Movimentação manual",
                });
              }}
            >
              Confirmar Movimentação de Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Item no Catálogo */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Item no Catálogo</DialogTitle>
            <DialogDescription className="text-slate-400">
              Adicione um novo Material ou EPI para disponibilizar nas requisições.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Código do Item</Label>
                <Input 
                  placeholder="Ex: EPI-006" 
                  value={newItemCode} 
                  onChange={e => setNewItemCode(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Categoria</Label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="EPI">EPI</SelectItem>
                    <SelectItem value="Material">Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold text-slate-300">Nome / Descrição do Item</Label>
              <Input 
                placeholder="Ex: Máscara PFF2 com Válvula" 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Unidade</Label>
                <Input 
                  placeholder="un, par, cx..." 
                  value={newItemUnit} 
                  onChange={e => setNewItemUnit(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Estoque Inicial</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={newItemStock} 
                  onChange={e => setNewItemStock(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-semibold text-slate-300">Estoque Mínimo</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={newItemMinStock} 
                  onChange={e => setNewItemMinStock(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => {
                if (!newItemCode || !newItemName) {
                  toast.error("Preencha o código e o nome do item.");
                  return;
                }
                createItemMutation.mutate({
                  code: newItemCode,
                  name: newItemName,
                  category: newItemCategory,
                  unit: newItemUnit,
                  stock: parseInt(newItemStock || "0"),
                  minStock: parseInt(newItemMinStock || "5"),
                });
              }}
            >
              Cadastrar Item no Catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
