"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleManager } from '../components/VehicleManager';
import { ClientManager } from '../components/ClientManager';
import { RentalContractsManager } from '../components/RentalContractsManager';
import { SaleContractsManager } from '../components/SaleContractsManager';
import { AutomobileSummary } from '../components/AutomobileSummary';
import { useSupabaseData } from '../hooks/use-supabase-data';
import { Vehicle, Client, RentalContract, SaleContract } from '../types/automobile';
import { Car, Users, FileText, DollarSign, Building2, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AutomobileManagement = () => {
  const vehiclesData = useSupabaseData<Vehicle>('vehicles');
  const clientsData = useSupabaseData<Client>('auto_clients');
  const rentalContractsData = useSupabaseData<RentalContract>('rental_contracts');
  const saleContractsData = useSupabaseData<SaleContract>('sale_contracts');

  const sellers = [{ id: '1', name: 'Agence Automobile' }];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* En-tête principal */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-inner">
            <Car className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none uppercase">GESTION AUTOMOBILE PRO</h1>
            <p className="text-[10px] opacity-80 uppercase tracking-widest mt-1">Flotte & Contrats</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild className="bg-white/10 hover:bg-white/20 text-white border-none shadow-md">
            <Link to="/">
              <Building2 className="w-4 h-4 mr-2" />
              GESTION LOCATIVE
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Tableau de bord de synthèse */}
        <AutomobileSummary 
          vehicles={vehiclesData.data}
          rentalContracts={rentalContractsData.data}
          saleContracts={saleContractsData.data}
        />

        {/* Onglets de navigation */}
        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-muted p-1.5 rounded-2xl mb-8 shadow-inner gap-1">
            <TabsTrigger value="vehicles" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">
              <Car className="w-4 h-4 mr-2" /> VÉHICULES
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">
              <Users className="w-4 h-4 mr-2" /> CLIENTS
            </TabsTrigger>
            <TabsTrigger value="rental" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">
              <FileText className="w-4 h-4 mr-2" /> LOCATIONS
            </TabsTrigger>
            <TabsTrigger value="sales" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold">
              <DollarSign className="w-4 h-4 mr-2" /> VENTES
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-6">
            <VehicleManager 
              vehicles={vehiclesData.data} 
              onAdd={vehiclesData.addItem}
              onDelete={vehiclesData.deleteItem}
              onUpdate={vehiclesData.updateItem}
            />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <ClientManager 
              clients={clientsData.data} 
              onAdd={clientsData.addItem}
              onDelete={clientsData.deleteItem}
            />
          </TabsContent>

          <TabsContent value="rental" className="space-y-6">
            <RentalContractsManager 
              rentalContracts={rentalContractsData.data} 
              onAdd={rentalContractsData.addItem}
              onDelete={rentalContractsData.deleteItem}
              vehicles={vehiclesData.data}
              clients={clientsData.data}
            />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SaleContractsManager 
              saleContracts={saleContractsData.data} 
              onAdd={saleContractsData.addItem}
              onDelete={saleContractsData.deleteItem}
              vehicles={vehiclesData.data}
              sellers={sellers}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AutomobileManagement;