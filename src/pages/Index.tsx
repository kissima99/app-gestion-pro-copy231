import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OwnerManager } from '../components/OwnerManager';
import { TenantManager } from '../components/TenantManager';
import { ReceiptManager } from '../components/ReceiptManager';
import { ExpenseManager } from '../components/ExpenseManager';
import { ArrearsManager } from '../components/ArrearsManager';
import { MonthlySummary } from '../components/MonthlySummary';
import { OwnerFinanceSummary } from '../components/OwnerFinanceSummary';
import { AgencyForm } from '../components/AgencyForm';
import { DataManagement } from '../components/DataManagement';
import { useSupabaseData } from '../hooks/use-supabase-data';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Owner, Tenant, Receipt, Expense, Agency, Arrear } from '../types/rental';
import { Building2, Moon, Sun, Car, Wrench, LogOut, ShieldCheck, Users, Receipt as ReceiptIcon, Wallet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { supabase } from '../lib/supabase';
import { toast } from "sonner";
import { useAuth } from '../components/AuthProvider';

const Index = () => {
  const { theme, setTheme } = useTheme();
  const { session, profile } = useAuth();

  const ownersData = useSupabaseData<Owner>('owners');
  const tenantsData = useSupabaseData<Tenant>('tenants');
  const receiptsData = useSupabaseData<Receipt>('receipts');
  const expensesData = useSupabaseData<Expense>('expenses');
  const arrearsData = useSupabaseData<Arrear>('arrears');

  const [agency, setAgency] = useLocalStorage<Agency>('rental_agency', {
    name: '', address: '', phone: '', email: '', ninea: '', rccm: '', commissionRate: 10
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Erreur de déconnexion");
    else toast.success("Déconnecté avec succès");
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-inner">
            <Building2 className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none uppercase">GESTION LOCATIVE PRO sn</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] opacity-80 uppercase tracking-widest">{session?.user?.email?.split('@')[0]}</span>
              <span className="w-1 h-1 bg-white/50 rounded-full"></span>
              <span className="text-[10px] opacity-80 uppercase tracking-widest">Compte Actif</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <Button variant="secondary" size="sm" asChild className="hidden md:flex mr-2 bg-red-600 hover:bg-red-700 text-white border-none shadow-md">
              <Link to="/super-admin">
                <ShieldCheck className="w-4 h-4 mr-2" />
                SUPER-ADMIN
              </Link>
            </Button>
          )}

          <Button variant="secondary" size="sm" asChild className="hidden md:flex mr-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md">
            <Link to="/automobile">
              <Car className="w-4 h-4 mr-2" />
              ACCÈS AUTOMOBILE
            </Link>
          </Button>
          
          <Button 
            variant="ghost" size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full hover:bg-white/20 text-white"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button 
            variant="ghost" size="icon" 
            onClick={handleLogout}
            className="rounded-full hover:bg-red-500/20 text-white"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div className="md:hidden flex flex-col gap-2 mb-4">
          {profile?.role === 'admin' && (
            <Button variant="secondary" size="sm" asChild className="w-full bg-red-600 hover:bg-red-700 text-white border-none shadow-md">
              <Link to="/super-admin">
                <ShieldCheck className="w-4 h-4 mr-2" />
                SUPER-ADMIN
              </Link>
            </Button>
          )}
          <Button variant="secondary" size="sm" asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md">
            <Link to="/automobile">
              <Car className="w-4 h-4 mr-2" />
              ACCÈS AUTOMOBILE
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full bg-muted p-1.5 rounded-2xl mb-8 shadow-inner gap-1">
            <TabsTrigger value="admin" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">ADMIN</TabsTrigger>
            <TabsTrigger value="owners" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">PROPRIÉTAIRE</TabsTrigger>
            <TabsTrigger value="tenants" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">LOCATAIRE</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">DÉPENSE</TabsTrigger>
            <TabsTrigger value="receipts" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">QUITTANCES</TabsTrigger>
            <TabsTrigger value="bilans" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">BILAN</TabsTrigger>
          </TabsList>

          {/* 1. ADMIN */}
          <TabsContent value="admin" className="space-y-6">
            <div className="max-w-2xl mx-auto space-y-8">
              <AgencyForm agency={agency} setAgency={setAgency} />
              <DataManagement />
            </div>
          </TabsContent>

          {/* 2. PROPRIETAIRE */}
          <TabsContent value="owners" className="space-y-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="bg-primary p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-primary">Gestion des Propriétaires</h2>
            </div>
            <OwnerManager 
              owners={ownersData.data} 
              onAdd={ownersData.addItem} 
              onDelete={ownersData.deleteItem} 
            />
          </TabsContent>

          {/* 3. LOCATAIRE */}
          <TabsContent value="tenants" className="space-y-6">
            <Tabs defaultValue="tenants_list">
              <TabsList className="bg-transparent border-b w-full justify-start gap-8 mb-6">
                <TabsTrigger value="tenants_list" className="font-black text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none pb-2">Liste des Locataires</TabsTrigger>
                <TabsTrigger value="arrears" className="font-black text-lg data-[state=active]:text-primary data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none pb-2">Suivi des Impayés</TabsTrigger>
              </TabsList>
              <TabsContent value="tenants_list">
                <TenantManager 
                  tenants={tenantsData.data} 
                  onAdd={tenantsData.addItem} 
                  onDelete={tenantsData.deleteItem} 
                  owners={ownersData.data} 
                />
              </TabsContent>
              <TabsContent value="arrears">
                <ArrearsManager 
                  tenants={tenantsData.data} 
                  receipts={receiptsData.data} 
                  manualArrears={arrearsData.data} 
                  onAdd={arrearsData.addItem} 
                  onDelete={arrearsData.deleteItem} 
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* 4. DEPENSE */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-primary">Gestion des Dépenses & Travaux</h2>
            </div>
            <ExpenseManager 
              expenses={expensesData.data} 
              onAdd={expensesData.addItem} 
              onDelete={expensesData.deleteItem} 
              owners={ownersData.data} 
            />
          </TabsContent>

          {/* 5. QUITTANCES */}
          <TabsContent value="receipts" className="space-y-8">
            <MonthlySummary receipts={receiptsData.data} expenses={expensesData.data} agency={agency} />
            <ReceiptManager 
              receipts={receiptsData.data} 
              onAdd={receiptsData.addItem} 
              onDelete={receiptsData.deleteItem} 
              tenants={tenantsData.data} 
              owners={ownersData.data}
              expenses={expensesData.data}
              agency={agency}
            />
          </TabsContent>

          {/* 6. BILAN */}
          <TabsContent value="bilans" className="space-y-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="bg-primary p-2 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-primary">Bilans Financiers des Propriétaires</h2>
            </div>
            <OwnerFinanceSummary 
              owners={ownersData.data} 
              tenants={tenantsData.data} 
              receipts={receiptsData.data} 
              expenses={expensesData.data} 
              agency={agency} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;