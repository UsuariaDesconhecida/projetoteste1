import React, { useEffect, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileBarChart2,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Warehouse,
  XCircle,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getNavigationForRole, ADMIN_NAVIGATION as ADMIN_MODULES } from "@shared/navigation";

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
  "Vendas",
];

type AdminTab = (typeof ADMIN_MODULES)[number]["id"];

const NAVIGATION_ICONS: Record<AdminTab, React.ElementType> = {
  dashboard: LayoutDashboard,
  materiais: Package,
  requisicao: ClipboardList,
  requisicoes: FileText,
  entrada: Warehouse,
  relatorios: FileBarChart2,
};

const ADMIN_NAVIGATION = ADMIN_MODULES.map((item) => ({
  ...item,
  icon: NAVIGATION_ICONS[item.id],
}));

function StatusBadge({ status }: { status: "pendente" | "aprovada" | "recusada" }) {
  const styles = {
    pendente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    aprovada: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    recusada: "bg-red-500/15 text-red-300 border-red-500/30",
  } as const;

  return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigation = getNavigationForRole(isAdmin ? "admin" : "solicitante").map((item) => ({
    ...item,
    icon: NAVIGATION_ICONS[item.id],
  }));
  const [activeTab, setActiveTab] = useState<AdminTab | "requisicao">("requisicao");

  const [reqRequester, setReqRequester] = useState("");
  const [reqArea, setReqArea] = useState("");
  const [reqItemId, setReqItemId] = useState("");
  const [reqQuantity, setReqQuantity] = useState("1");
  const [reqJustification, setReqJustification] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [adminObs, setAdminObs] = useState("");

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItemId, setStockItemId] = useState("");
  const [stockType, setStockType] = useState<"entrada" | "saida">("entrada");
  const [stockQty, setStockQty] = useState("1");
  const [stockReason, setStockReason] = useState("");

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("EPI");
  const [newItemUnit, setNewItemUnit] = useState("un");
  const [newItemStock, setNewItemStock] = useState("0");
  const [newItemMinStock, setNewItemMinStock] = useState("5");

  const catalogQuery = trpc.catalog.list.useQuery();
  const requisitionsQuery = trpc.requisition.list.useQuery(undefined, { enabled: isAdmin });
  const statsQuery = trpc.stock.stats.useQuery(undefined, { enabled: isAdmin });
  const movementsQuery = trpc.stock.movements.useQuery(undefined, { enabled: isAdmin });

  useEffect(() => {
    if (!isAdmin && activeTab !== "requisicao") {
      setActiveTab("requisicao");
    }
  }, [activeTab, isAdmin]);

  const createReqMutation = trpc.requisition.create.useMutation({
    onSuccess: () => {
      toast.success("Requisição enviada com sucesso.");
      setReqRequester("");
      setReqArea("");
      setReqItemId("");
      setReqQuantity("1");
      setReqJustification("");
      setItemSearch("");
    },
    onError: (error) => toast.error(`Erro ao enviar requisição: ${error.message}`),
  });

  const updateStatusMutation = trpc.requisition.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Requisição atualizada com sucesso.");
      setEvalModalOpen(false);
      setSelectedReqId(null);
      setAdminObs("");
      void requisitionsQuery.refetch();
      void statsQuery.refetch();
      void catalogQuery.refetch();
      void movementsQuery.refetch();
    },
    onError: (error) => toast.error(`Erro ao atualizar requisição: ${error.message}`),
  });

  const stockMoveMutation = trpc.stock.move.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada com sucesso.");
      setStockModalOpen(false);
      setStockItemId("");
      setStockReason("");
      setStockQty("1");
      void catalogQuery.refetch();
      void statsQuery.refetch();
      void movementsQuery.refetch();
    },
    onError: (error) => toast.error(`Erro na movimentação: ${error.message}`),
  });

  const createItemMutation = trpc.catalog.create.useMutation({
    onSuccess: () => {
      toast.success("Item cadastrado no catálogo.");
      setItemModalOpen(false);
      setNewItemCode("");
      setNewItemName("");
      setNewItemStock("0");
      void catalogQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (error) => toast.error(`Erro ao cadastrar item: ${error.message}`),
  });

  const handleReqSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reqItemId) {
      toast.error("Selecione um item do catálogo.");
      return;
    }

    createReqMutation.mutate({
      requesterName: reqRequester.trim(),
      area: reqArea,
      itemId: Number(reqItemId),
      quantity: Number(reqQuantity),
      justification: reqJustification.trim(),
    });
  };

  const filteredCatalog = (catalogQuery.data ?? []).filter((item) =>
    `${item.code} ${item.name}`.toLowerCase().includes(itemSearch.toLowerCase()),
  );
  const requestCatalogOptions = filteredCatalog.slice(0, 150);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(30,64,175,0.16),transparent_42%)]" />
        <Card className="relative w-full max-w-md bg-slate-900/95 border-slate-800 shadow-2xl">
          <CardHeader className="space-y-5 text-center">
            <div className="mx-auto bg-red-600 text-white p-3 rounded-2xl w-fit shadow-lg shadow-red-950/40">
              <Boxes className="w-8 h-8" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Almoxarifado Forvia</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                Gestão corporativa de materiais, EPIs e requisições.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Acesso corporativo</p>
              <p className="mt-1 leading-relaxed">Entre com suas credenciais Forvia para acessar as funcionalidades liberadas para o seu perfil.</p>
            </div>
            <Button onClick={() => startLogin()} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-11">
              Entrar com acesso Forvia
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = isAdmin
    ? ADMIN_NAVIGATION.find((item) => item.id === activeTab)?.label ?? "Dashboard"
    : "Nova Requisição";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-red-600 text-white p-2 rounded-xl font-bold tracking-wider flex items-center shadow-md shrink-0">
            <Boxes className="w-6 h-6 mr-2" />
            <span className="text-lg">FORVIA</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-white truncate">Almoxarifado & Gestão de EPIs</h1>
            <p className="text-xs text-slate-400 truncate">Sistema Integrado de Requisições e Controle de Estoque</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-white">{user.name || user.email || "Usuário Forvia"}</p>
            <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider">{isAdmin ? "Administrador" : "Solicitante"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void logout()} className="text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Sair">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row">
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/45 p-4 lg:p-5">
          <div className="mb-5 px-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">Área de trabalho</p>
            <p className="mt-1 text-sm text-slate-300">{isAdmin ? "Gestão do almoxarifado" : "Solicitações corporativas"}</p>
          </div>
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2" aria-label="Navegação principal">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${active ? "bg-red-600 text-white shadow-lg shadow-red-950/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="hidden lg:block mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <ShieldAlert className="w-5 h-5 text-red-500 mb-3" />
            <p className="text-xs leading-relaxed text-slate-400">As permissões são definidas automaticamente pelo seu acesso corporativo Forvia.</p>
          </div>
        </aside>

        <main className="flex-1 p-5 lg:p-8 space-y-6 min-w-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-red-400 font-bold">Almoxarifado Forvia</p>
              <h2 className="mt-1 text-2xl lg:text-3xl font-bold text-white">{pageTitle}</h2>
            </div>
            {isAdmin && <span className="text-xs text-slate-500">Perfil com acesso total</span>}
          </div>

          {activeTab === "requisicao" && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-red-500" />Solicitação de Material ou EPI</CardTitle>
                  <CardDescription className="text-slate-400">Preencha os campos abaixo para enviar uma nova requisição ao almoxarifado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReqSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Nome do Solicitante *</Label><Input placeholder="Digite seu nome completo" value={reqRequester} onChange={(event) => setReqRequester(event.target.value)} className="bg-slate-950 border-slate-800 text-white" required /></div>
                      <div className="space-y-2"><Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Área / Setor *</Label><Select value={reqArea} onValueChange={setReqArea}><SelectTrigger className="bg-slate-950 border-slate-800 text-white"><SelectValue placeholder="Selecione a área" /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white">{AREAS.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="space-y-2"><Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Item Solicitado (Catálogo) *</Label><div className="space-y-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><Input placeholder="Buscar item por nome ou código..." value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} className="bg-slate-950 border-slate-800 text-white pl-9" /></div>{catalogQuery.isLoading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Carregando catálogo...</div> : catalogQuery.isError ? <p className="text-sm text-red-400">Não foi possível carregar o catálogo.</p> : <Select value={reqItemId} onValueChange={setReqItemId}><SelectTrigger className="bg-slate-950 border-slate-800 text-white"><SelectValue placeholder="Selecione o item no catálogo" /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white max-h-60">{requestCatalogOptions.length === 0 ? <SelectItem value="empty" disabled>Nenhum item encontrado</SelectItem> : <>{requestCatalogOptions.map((item) => <SelectItem key={item.id} value={item.id.toString()}>{item.code} - {item.name} (Estoque: {item.stock} {item.unit})</SelectItem>)}{filteredCatalog.length > requestCatalogOptions.length && <SelectItem value="more-results" disabled>Refine a busca para ver mais resultados</SelectItem>}</>}</SelectContent></Select>}</div></div>
                    <div className="space-y-2 max-w-xs"><Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Quantidade *</Label><Input type="number" min="1" value={reqQuantity} onChange={(event) => setReqQuantity(event.target.value)} className="bg-slate-950 border-slate-800 text-white" required /></div>
                    <div className="space-y-2"><Label className="text-xs uppercase font-semibold tracking-wider text-slate-300">Justificativa / Motivo *</Label><Textarea placeholder="Informe o motivo da requisição..." value={reqJustification} onChange={(event) => setReqJustification(event.target.value)} className="bg-slate-950 border-slate-800 text-white min-h-[120px]" required /></div>
                    <Button type="submit" disabled={createReqMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-11">{createReqMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}Enviar Requisição</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800 shadow-xl h-fit"><CardHeader><CardTitle className="text-base font-bold text-white flex items-center"><ShieldAlert className="w-5 h-5 mr-2 text-red-500" />Orientações</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-slate-300"><p>Selecione o item exclusivamente a partir do catálogo oficial.</p><p>Informe uma justificativa clara para facilitar a análise do almoxarifado.</p><p>O saldo é atualizado automaticamente após a aprovação administrativa.</p></CardContent></Card>
            </div>
          )}

          {activeTab === "dashboard" && isAdmin && (
            <div className="space-y-6">
              {statsQuery.isLoading ? <LoadingState label="Carregando indicadores..." /> : statsQuery.isError ? <ErrorState label="Não foi possível carregar o dashboard." onRetry={() => void statsQuery.refetch()} /> : statsQuery.data ? <DashboardContent stats={statsQuery.data} requisitions={requisitionsQuery.data ?? []} onEvaluate={(id) => { setSelectedReqId(id); setEvalModalOpen(true); }} /> : <EmptyState label="Nenhum indicador disponível." />}
            </div>
          )}

          {activeTab === "materiais" && isAdmin && <MaterialsContent catalog={catalogQuery.data ?? []} search={itemSearch} setSearch={setItemSearch} onNewItem={() => setItemModalOpen(true)} isLoading={catalogQuery.isLoading} />}

          {activeTab === "requisicoes" && isAdmin && <RequestsContent requisitions={requisitionsQuery.data ?? []} isLoading={requisitionsQuery.isLoading} isError={requisitionsQuery.isError} onRetry={() => void requisitionsQuery.refetch()} onEvaluate={(id) => { setSelectedReqId(id); setEvalModalOpen(true); }} />}

          {activeTab === "entrada" && isAdmin && <StockContent movements={movementsQuery.data ?? []} isLoading={movementsQuery.isLoading} onOpen={() => setStockModalOpen(true)} />}

          {activeTab === "relatorios" && isAdmin && <ReportsContent stats={statsQuery.data} isLoading={statsQuery.isLoading} />}
        </main>
      </div>

      <Dialog open={evalModalOpen} onOpenChange={setEvalModalOpen}><DialogContent className="bg-slate-900 border-slate-800 text-white"><DialogHeader><DialogTitle>Avaliar Requisição #{selectedReqId}</DialogTitle><DialogDescription className="text-slate-400">A aprovação baixa automaticamente o saldo do item.</DialogDescription></DialogHeader><div className="py-4 space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Observação</Label><Textarea placeholder="Observação opcional..." value={adminObs} onChange={(event) => setAdminObs(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div><DialogFooter><Button variant="outline" disabled={updateStatusMutation.isPending} className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => selectedReqId && updateStatusMutation.mutate({ id: selectedReqId, status: "recusada", adminObservation: adminObs })}><XCircle className="w-4 h-4 mr-2" />Recusar</Button><Button disabled={updateStatusMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => selectedReqId && updateStatusMutation.mutate({ id: selectedReqId, status: "aprovada", adminObservation: adminObs })}><CheckCircle2 className="w-4 h-4 mr-2" />Aprovar e Baixar</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}><DialogContent className="bg-slate-900 border-slate-800 text-white"><DialogHeader><DialogTitle>Entrada ou Saída de Estoque</DialogTitle><DialogDescription className="text-slate-400">Registre a movimentação manual de um item do catálogo.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Item</Label><Select value={stockItemId} onValueChange={setStockItemId}><SelectTrigger className="bg-slate-950 border-slate-800 text-white"><SelectValue placeholder="Selecione o item" /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white">{(catalogQuery.data ?? []).map((item) => <SelectItem key={item.id} value={item.id.toString()}>{item.code} - {item.name} (Atual: {item.stock} {item.unit})</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Tipo</Label><Select value={stockType} onValueChange={(value) => setStockType(value as "entrada" | "saida")}><SelectTrigger className="bg-slate-950 border-slate-800 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white"><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Quantidade</Label><Input type="number" min="1" value={stockQty} onChange={(event) => setStockQty(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div></div><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Motivo</Label><Textarea placeholder="Nota fiscal ou justificativa..." value={stockReason} onChange={(event) => setStockReason(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div></div><DialogFooter><Button disabled={stockMoveMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => { if (!stockItemId) { toast.error("Selecione um item."); return; } stockMoveMutation.mutate({ itemId: Number(stockItemId), type: stockType, quantity: Number(stockQty), reason: stockReason || "Movimentação manual" }); }}>Confirmar Movimentação</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}><DialogContent className="bg-slate-900 border-slate-800 text-white"><DialogHeader><DialogTitle>Cadastrar Item</DialogTitle><DialogDescription className="text-slate-400">Adicione um novo Material ou EPI ao catálogo.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Código</Label><Input placeholder="Ex: EPI-006" value={newItemCode} onChange={(event) => setNewItemCode(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Categoria</Label><Select value={newItemCategory} onValueChange={setNewItemCategory}><SelectTrigger className="bg-slate-950 border-slate-800 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white"><SelectItem value="EPI">EPI</SelectItem><SelectItem value="Material">Material</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Nome</Label><Input placeholder="Nome ou descrição do item" value={newItemName} onChange={(event) => setNewItemName(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Unidade</Label><Input value={newItemUnit} onChange={(event) => setNewItemUnit(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Estoque</Label><Input type="number" min="0" value={newItemStock} onChange={(event) => setNewItemStock(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div><div className="space-y-2"><Label className="text-xs uppercase font-semibold text-slate-300">Mínimo</Label><Input type="number" min="0" value={newItemMinStock} onChange={(event) => setNewItemMinStock(event.target.value)} className="bg-slate-950 border-slate-800 text-white" /></div></div></div><DialogFooter><Button disabled={createItemMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => { if (!newItemCode || !newItemName) { toast.error("Preencha código e nome."); return; } createItemMutation.mutate({ code: newItemCode, name: newItemName, category: newItemCategory, unit: newItemUnit, stock: Number(newItemStock), minStock: Number(newItemMinStock) }); }}>Cadastrar Item</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="min-h-56 rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin text-red-500" />{label}</div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="min-h-56 rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 flex items-center justify-center text-sm text-slate-500">{label}</div>;
}

function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300 flex items-center justify-between gap-4"><span>{label}</span><Button variant="outline" onClick={onRetry} className="border-red-500/40 text-red-300 hover:bg-red-500/10">Tentar novamente</Button></div>;
}

function DashboardContent({ stats, requisitions, onEvaluate }: { stats: { pendingReqs: number; lowStockCount: number; totalItems: number; areaConsumption: Array<{ area: string; total: number }>; itemConsumption: Array<{ name: string; total: number }> }; requisitions: Array<{ id: number; requesterName: string; area: string; itemName: string | null; itemUnit: string | null; quantity: number; status: "pendente" | "aprovada" | "recusada" }>; onEvaluate: (id: number) => void }) {
  return <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><KpiCard label="Requisições Pendentes" value={stats.pendingReqs} icon={<ClipboardList className="w-5 h-5 text-amber-400" />} /><KpiCard label="Estoque Baixo" value={stats.lowStockCount} icon={<AlertTriangle className="w-5 h-5 text-red-400" />} /><KpiCard label="Itens no Catálogo" value={stats.totalItems} icon={<Package className="w-5 h-5 text-emerald-400" />} /></div><div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><ConsumptionChart title="Consumo por Área" data={stats.areaConsumption} dataKey="area" color="#ef4444" /><ConsumptionChart title="Itens Mais Solicitados" data={stats.itemConsumption} dataKey="name" color="#3b82f6" /></div><RequestsTable requisitions={requisitions} onEvaluate={onEvaluate} compact /></div>;
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <Card className="bg-slate-900 border-slate-800 shadow-xl"><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-300">{label}</CardTitle>{icon}</CardHeader><CardContent><p className="text-3xl font-bold text-white">{value}</p></CardContent></Card>;
}

function ConsumptionChart({ title, data, dataKey, color }: { title: string; data: Array<{ [key: string]: string | number }>; dataKey: string; color: string }) {
  return <Card className="bg-slate-900 border-slate-800 shadow-xl"><CardHeader><CardTitle className="text-base text-white flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-red-500" />{title}</CardTitle></CardHeader><CardContent className="h-80">{data.length === 0 ? <EmptyState label="Ainda não há consumo aprovado para exibir." /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey={dataKey} stroke="#94a3b8" fontSize={10} interval={0} angle={data.length > 5 ? -18 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 58 : 30} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} /><Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</CardContent></Card>;
}

function MaterialsContent({ catalog, search, setSearch, onNewItem, isLoading }: { catalog: Array<{ id: number; code: string; name: string; category: string; unit: string; stock: number; minStock: number }>; search: string; setSearch: (value: string) => void; onNewItem: () => void; isLoading: boolean }) {
  const filtered = catalog.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(search.toLowerCase()));
  const visible = filtered.slice(0, 120);
  return <div className="space-y-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><p className="text-sm text-slate-400">Catálogo oficial · {catalog.length.toLocaleString("pt-BR")} itens</p><h3 className="text-xl font-bold text-white">Materiais & EPIs</h3><p className="mt-1 text-xs text-slate-500">{filtered.length.toLocaleString("pt-BR")} resultado(s) para a busca atual</p></div><div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><Input placeholder="Pesquisar part number ou descrição..." value={search} onChange={(event) => setSearch(event.target.value)} className="bg-slate-900 border-slate-800 text-white pl-9 w-72" /></div><Button onClick={onNewItem} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="w-4 h-4 mr-2" />Novo Item</Button></div></div>{isLoading ? <LoadingState label="Carregando catálogo..." /> : filtered.length === 0 ? <EmptyState label="Nenhum item encontrado." /> : <><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{visible.map((item) => { const low = item.stock <= item.minStock; return <Card key={item.id} className="bg-slate-900 border-slate-800 shadow-xl"><CardHeader className="pb-3"><div className="flex items-center justify-between"><Badge variant="outline" className="border-slate-700 text-slate-400 font-mono">{item.code}</Badge><Badge className={item.category === "EPI" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-purple-500/15 text-purple-300 border-purple-500/30"}>{item.category}</Badge></div><CardTitle className="text-base text-white mt-2">{item.name}</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Saldo atual</p><p className={`text-2xl font-bold ${low ? "text-red-400" : "text-white"}`}>{item.stock.toLocaleString("pt-BR")} <span className="text-sm font-normal text-slate-400">{item.unit}</span></p></div>{low && <span className="text-xs text-red-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Baixo</span>}</div><p className="mt-3 text-xs text-slate-500">Mínimo recomendado: {item.minStock} {item.unit}</p></CardContent></Card>; })}</div>{filtered.length > visible.length && <p className="text-center text-xs text-slate-500">Exibindo os primeiros {visible.length} resultados. Refine a busca para localizar um part number específico.</p>}</>}</div>;
}

function RequestsContent({ requisitions, isLoading, isError, onRetry, onEvaluate }: { requisitions: Array<{ id: number; requesterName: string; area: string; itemName: string | null; itemUnit: string | null; quantity: number; justification: string; status: "pendente" | "aprovada" | "recusada" }>; isLoading: boolean; isError: boolean; onRetry: () => void; onEvaluate: (id: number) => void }) {
  if (isLoading) return <LoadingState label="Carregando requisições..." />;
  if (isError) return <ErrorState label="Não foi possível carregar as requisições." onRetry={onRetry} />;
  return <Card className="bg-slate-900 border-slate-800 shadow-xl"><CardHeader><CardTitle className="text-white">Todas as Requisições</CardTitle><CardDescription className="text-slate-400">Avalie as solicitações recebidas pelo almoxarifado.</CardDescription></CardHeader><CardContent><RequestsTable requisitions={requisitions} onEvaluate={onEvaluate} /></CardContent></Card>;
}

function RequestsTable({ requisitions, onEvaluate, compact = false }: { requisitions: Array<{ id: number; requesterName: string; area: string; itemName: string | null; itemUnit: string | null; quantity: number; justification?: string; status: "pendente" | "aprovada" | "recusada" }>; onEvaluate: (id: number) => void; compact?: boolean }) {
  return <div className={`overflow-x-auto ${compact ? "max-h-80 overflow-y-auto" : ""}`}>{requisitions.length === 0 ? <EmptyState label="Nenhuma requisição registrada." /> : <Table><TableHeader className="bg-slate-950"><TableRow className="border-slate-800"><TableHead className="text-slate-300">Solicitante</TableHead><TableHead className="text-slate-300">Item / Qtd</TableHead><TableHead className="text-slate-300 hidden md:table-cell">Área</TableHead><TableHead className="text-slate-300">Status</TableHead><TableHead className="text-slate-300 text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{requisitions.map((req) => <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/50"><TableCell><p className="font-semibold text-white">#{req.id} · {req.requesterName}</p><p className="text-xs text-slate-500">{req.justification}</p></TableCell><TableCell><p className="text-sm text-slate-200">{req.itemName ?? "Item"}</p><p className="text-xs text-red-300">{req.quantity} {req.itemUnit ?? "un"}</p></TableCell><TableCell className="hidden md:table-cell text-sm text-slate-400">{req.area}</TableCell><TableCell><StatusBadge status={req.status} /></TableCell><TableCell className="text-right">{req.status === "pendente" && <Button size="sm" variant="outline" onClick={() => onEvaluate(req.id)} className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">Avaliar</Button>}</TableCell></TableRow>)}</TableBody></Table>}</div>;
}

function StockContent({ movements, isLoading, onOpen }: { movements: Array<{ id: number; type: "entrada" | "saida"; quantity: number; reason: string; responsible: string; createdAt: Date; itemName: string | null; itemCode: string | null; itemUnit: string | null }>; isLoading: boolean; onOpen: () => void }) {
  return <div className="space-y-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-400">Operação de estoque</p><h3 className="text-xl font-bold text-white">Entrada Estoque</h3></div><Button onClick={onOpen} className="bg-red-600 hover:bg-red-700 text-white"><Plus className="w-4 h-4 mr-2" />Registrar Entrada / Saída</Button></div><Card className="bg-slate-900 border-slate-800 shadow-xl"><CardHeader><CardTitle className="text-white flex items-center"><ArrowUpDown className="w-5 h-5 mr-2 text-red-500" />Histórico de Movimentações</CardTitle></CardHeader><CardContent>{isLoading ? <LoadingState label="Carregando movimentações..." /> : movements.length === 0 ? <EmptyState label="Nenhuma movimentação registrada." /> : <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-950"><TableRow className="border-slate-800"><TableHead className="text-slate-300">Data</TableHead><TableHead className="text-slate-300">Tipo</TableHead><TableHead className="text-slate-300">Item</TableHead><TableHead className="text-slate-300">Quantidade</TableHead><TableHead className="text-slate-300">Responsável</TableHead></TableRow></TableHeader><TableBody>{movements.map((movement) => <TableRow key={movement.id} className="border-slate-800"><TableCell className="text-xs text-slate-400">{new Date(movement.createdAt).toLocaleString()}</TableCell><TableCell><Badge className={movement.type === "entrada" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-red-500/15 text-red-300 border-red-500/30"}>{movement.type.toUpperCase()}</Badge></TableCell><TableCell className="text-sm text-white">{movement.itemName} <span className="text-xs text-slate-500">({movement.itemCode})</span></TableCell><TableCell className="font-semibold text-white">{movement.type === "entrada" ? "+" : "-"}{movement.quantity} {movement.itemUnit}</TableCell><TableCell className="text-sm text-slate-400">{movement.responsible}</TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card></div>;
}

function ReportsContent({ stats, isLoading }: { stats: { areaConsumption: Array<{ area: string; total: number }>; itemConsumption: Array<{ name: string; total: number }> } | undefined; isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Carregando relatórios..." />;
  if (!stats) return <EmptyState label="Nenhum relatório disponível." />;
  return <div className="space-y-6"><div><p className="text-sm text-slate-400">Análise de consumo</p><h3 className="text-xl font-bold text-white">Relatórios</h3></div><div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><ConsumptionChart title="Consumo por Área / Setor" data={stats.areaConsumption} dataKey="area" color="#ef4444" /><ConsumptionChart title="Top Itens Solicitados" data={stats.itemConsumption} dataKey="name" color="#3b82f6" /></div></div>;
}

