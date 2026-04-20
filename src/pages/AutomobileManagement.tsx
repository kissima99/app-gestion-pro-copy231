"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleManager } from '../components/VehicleManager';
import { ClientManager } from '../components/ClientManager';
import { RentalContractsManager } from '../components/RentalContractsManager';
import { SaleContractsManager } from '../components/SaleContractsManager';
import { useSupabaseData } from '../hooks/use-supabase-data';
import { Vehicle, Client, RentalContract, SaleContract } from '../types/automobile';
import { Car, Users, FileText, DollarSign, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AutomobileManagement = () => {
  const vehiclesData = useSupabaseData<Vehicle>('vehicles');
  const clientsData = useSupabaseData<Client>('auto_clients');
  const rentalContractsData = useSupabaseData<RentalContract>('rental_contracts');
  const saleContractsData = useSupabaseData<SaleContract>('sale_contracts');

  const sellers = [{ id: '1', name: 'Agence Automobile' }];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-3 rounded-xl">
              <Car className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">GESTION AUTOMOBILE</h1>
              <p className="text-muted-foreground">Gestion sécurisée de votre flotte de véhicules</p>
            </div>
          </div>
          
          <Button variant="outline" asChild className="w-fit">
            <Link to="/">
              <Building2 className="w-4 h-4 mr-2" />
              Gestion Locative
            </Link>
          </Button>
        </header>

        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList className="grid grid-cols-4 bg-muted p-1 rounded-xl mb-6">
            <TabsTrigger value="vehicles" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Car className="w-4 h-4 mr-2" /> Véhicules
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Clients
            </TabsTrigger>
            <TabsTrigger value="rental" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Location
            </TabsTrigger>
            <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" /> Vente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles">
            <VehicleManager 
              vehicles={vehiclesData.data} 
              onAdd={vehiclesData.addItem}
              onDelete={vehiclesData.deleteItem}
              onUpdate={vehiclesData.updateItem}
            />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManager 
              clients={clientsData.data} 
              onAdd={clientsData.addItem}
              onDelete={clientsData.deleteItem}
            />
          </TabsContent>

          <TabsContent value="rental">
            <RentalContractsManager 
              rentalContracts={rentalContractsData.data} 
              onAdd={rentalContractsData.addItem}
              onDelete={rentalContractsData.deleteItem}
              vehicles={vehiclesData.data}
              clients={clientsData.data}
            />
          </TabsContent>

          <TabsContent value="sales">
            <SaleContractsManager 
              saleContracts={saleContractsData.data} 
              onAdd={saleContractsData.addItem}
              onDelete={saleContractsData.deleteItem}
              vehicles={vehiclesData.data}
              sellers={sellers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AutomobileManagement;