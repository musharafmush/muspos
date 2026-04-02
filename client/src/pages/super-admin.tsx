import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Globe, Calendar, CheckCircle, XCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  isActive: boolean;
  expiryDate: string | null;
  createdAt: string;
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", subdomain: "", expiryDate: "" });

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/saas/stats"],
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof newTenant) => {
      const res = await apiRequest("POST", "/api/tenants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({ title: "Success", description: "New client account created successfully." });
      setIsCreateOpen(false);
      setNewTenant({ name: "", subdomain: "", expiryDate: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create client.", variant: "destructive" });
    }
  });

  if (isLoading) return <div>Loading super admin dashboard...</div>;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Panel</h1>
            <p className="text-muted-foreground">Manage your Nebula POS clients and licenses.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Add New Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Client Account</DialogTitle>
                <DialogDescription>Setup a new separate POS instance for your client.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input 
                    placeholder="e.g. Acme Retail" 
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subdomain / Slug</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="acme" 
                      value={newTenant.subdomain}
                      onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                    />
                    <span className="text-muted-foreground">.nebulapos.com</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input 
                    type="date"
                    value={newTenant.expiryDate}
                    onChange={(e) => setNewTenant({ ...newTenant, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createTenantMutation.mutate(newTenant)}
                  disabled={createTenantMutation.isPending}
                >
                  {createTenantMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clients</CardTitle>
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Active Licenses</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants?.filter(t => t.isActive).length || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-blue-400">Registered Users</CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Across all clients</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Revenue</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹ {stats?.revenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Expected monthly</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Management</CardTitle>
            <CardDescription>Manage your active clients and their subscription status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No clients found. Click "Add New Client" to get started.
                    </TableCell>
                  </TableRow>
                )}
                {tenants?.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 font-mono">
                        {tenant.subdomain || "default-site"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tenant.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>
                      )}
                    </TableCell>
                    <TableCell>{tenant.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString() : "Never"}</TableCell>
                    <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
