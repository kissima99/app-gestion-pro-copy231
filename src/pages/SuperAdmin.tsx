import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, Users, Clock, Power, Search, 
  UserX, UserCheck, RefreshCw, ArrowLeft, ShieldAlert 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const SuperAdmin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch('https://izwbhtubezebdgqtuuwb.supabase.co/functions/v1/manage-users?action=list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur serveur");
      }

      const result = await response.json();
      setUsers(result.profiles || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des utilisateurs : " + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAccess = async (userId: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch('https://izwbhtubezebdgqtuuwb.supabase.co/functions/v1/manage-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          updates: { has_paid: !currentStatus }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur serveur");
      }
      
      toast.success(currentStatus ? "Accès suspendu avec succès" : "Accès activé avec succès");
      fetchUsers();
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch('https://izwbhtubezebdgqtuuwb.supabase.co/functions/v1/manage-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          updates: { role: newRole }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur serveur");
      }
      
      toast.success(`Rôle modifié en ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculer les statistiques
  const totalUsers = users.length;
  
  // Session active si mis à jour il y a moins de 15 minutes
  const getSessionStatus = (updatedAt: string) => {
    const lastActive = new Date(updatedAt).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - lastActive) / (1000 * 60);
    return diffMinutes < 15;
  };

  const activeSessions = users.filter(u => getSessionStatus(u.updated_at)).length;
  const suspendedUsers = users.filter(u => !u.has_paid).length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-xl uppercase tracking-wider">Super-Admin Control</h1>
              <p className="text-xs opacity-80">Gestion globale de la plateforme et des sessions</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild className="bg-white/10 hover:bg-white/20 text-white border-none">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Utilisateurs</p>
                <h3 className="text-3xl font-black mt-1">{totalUsers}</h3>
              </div>
              <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/30 shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-700 uppercase">Sessions Actives</p>
                <h3 className="text-3xl font-black text-green-800 mt-1">{activeSessions}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/30 shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-700 uppercase">Accès Suspendus</p>
                <h3 className="text-3xl font-black text-red-800 mt-1">{suspendedUsers}</h3>
              </div>
              <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et rafraîchissement */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              className="pl-10" 
              placeholder="Rechercher par ID ou rôle..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchUsers} 
            disabled={refreshing}
            className="w-full md:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser les sessions
          </Button>
        </div>

        {/* Tableau des utilisateurs */}
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle>Contrôle des Sessions & Autorisations</CardTitle>
            <CardDescription>
              Surveillez la dernière activité de vos clients et gérez instantanément leurs droits d'accès.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-4">ID Utilisateur</TableHead>
                    <TableHead className="p-4">Rôle</TableHead>
                    <TableHead className="p-4">Statut Session</TableHead>
                    <TableHead className="p-4">Dernière Activité</TableHead>
                    <TableHead className="p-4">Accès Logiciel</TableHead>
                    <TableHead className="p-4 text-right">Actions de Contrôle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                        Chargement des données de session...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                        Aucun utilisateur trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSessionActive = getSessionStatus(u.updated_at);
                      return (
                        <TableRow key={u.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-bold p-4">{u.id}</TableCell>
                          <TableCell className="p-4">
                            <Badge 
                              variant={u.role === 'admin' ? 'default' : 'secondary'}
                              className="cursor-pointer"
                              onClick={() => handleToggleRole(u.id, u.role)}
                              title="Cliquez pour changer le rôle"
                            >
                              {u.role?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4">
                            {isSessionActive ? (
                              <Badge className="bg-green-500 hover:bg-green-600 animate-pulse">
                                CONNECTÉ (ACTIVE)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                HORS LIGNE (EXPIRÉE)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs p-4 font-medium">
                            {new Date(u.updated_at).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell className="p-4">
                            {u.has_paid ? (
                              <Badge className="bg-blue-600">ACTIF / PAYÉ</Badge>
                            ) : (
                              <Badge variant="destructive">SUSPENDU / ESSAI</Badge>
                            )}
                          </TableCell>
                          <TableCell className="p-4 text-right flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant={u.has_paid ? "destructive" : "default"}
                              onClick={() => handleToggleAccess(u.id, u.has_paid)}
                              className="font-bold text-xs"
                            >
                              {u.has_paid ? (
                                <>
                                  <UserX className="w-3.5 h-3.5 mr-1" /> Suspendre / Déconnecter
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 mr-1" /> Activer l'accès
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SuperAdmin;