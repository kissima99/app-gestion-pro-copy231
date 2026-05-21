"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RentalContract, Vehicle, Client } from '../types/automobile';
import { generateRentalContractPDF } from '../lib/automobile-pdf-service';
import { FileText, Download, Plus, Calendar, DollarSign, Loader2, Trash2, Search } from 'lucide-react';
import { toast } from "sonner";

interface Props {
  rentalContracts: RentalContract[];
  onAdd: (contract: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  vehicles: Vehicle[];
  clients: Client[];
}

export const RentalContractsManager = ({ rentalContracts, onAdd, onDelete, vehicles, clients }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContract, setNewContract] = useState<Partial<RentalContract>>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    insuranceIncluded: true,
    status: 'active',
    paymentStatus: 'pending',
    createdDate: new Date().toISOString().split('T')[0]
  });

  const availableVehicles = vehicles.filter(v => v.status === 'available');

  const calculateTotalDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCreate = async () => {
    const vehicle = vehicles.find(v => v.id === newContract.vehicleId);
    const client = clients.find(c => c.id === newContract.clientId);

    if (!vehicle || !client || !newContract.startDate || !newContract.endDate) {
      toast.error("Veuillez sélectionner un véhicule, un client et définir les dates de location");
      return;
    }

    try {
      setIsSubmitting(true);
      const totalDays = calculateTotalDays(newContract.startDate, newContract.endDate);
      const totalAmount = totalDays * vehicle.dailyRate;

      const contractData = {
        ...newContract,
        contractNumber: `LOC-${Date.now().toString().slice(-6)}`,
        vehicleDetails: `${vehicle.brand} ${vehicle.model} (${vehicle.registration})`,
        clientName: `${client.firstName} ${client.lastName}`,
        totalDays,
        dailyRate: vehicle.dailyRate,
        totalAmount
      };

      const result = await onAdd(contractData);
      if (result) {
        generateRentalContractPDF(result, vehicle, client);
      }

      setNewContract({
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        insuranceIncluded: true,
        status: 'active',
        paymentStatus: 'pending',
        createdDate: new Date().toISOString().split('T')[0]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContracts = rentalContracts.filter(contract =>
    `${contract.contractNumber} ${contract.clientName} ${contract.vehicleDetails}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const inputStyle = "border-2 border-primary/30 text-black font-bold focus:border-primary focus:ring-primary h-11 bg-white";

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nouveau Contrat de Location
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-black text-primary text-sm uppercase">Véhicule disponible *</Label>
              <Select onValueChange={(v) => setNewContract({...newContract, vehicleId: v})} value={newContract.vehicleId}>
                <SelectTrigger className={inputStyle}>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id} className="font-bold">
                      {v.brand} {v.model} ({v.registration}) - {v.dailyRate?.toLocaleString()} FCFA/jour
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-primary text-sm uppercase">Client *</Label>
              <Select onValueChange={(v) => setNewContract({...newContract, clientId: v})} value={newContract.clientId}>
                <SelectTrigger className={inputStyle}>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-bold">
                      {c.firstName} {c.lastName} ({c.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-primary text-sm uppercase">Date de début *</Label>
              <Input 
                type="date" 
                value={newContract.startDate} 
                onChange={e => setNewContract({...newContract, startDate: e.target.value})}
                className={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black text-primary text-sm uppercase">Date de fin *</Label>
              <Input 
                type="date" 
                value={newContract.endDate} 
                onChange={e => setNewContract({...newContract, endDate: e.target.value})}
                className={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black text-primary text-sm uppercase">Statut du paiement</Label>
              <Select value={newContract.paymentStatus} onValueChange={(v: RentalContract['paymentStatus']) => setNewContract({...newContract, paymentStatus: v})}>
                <SelectTrigger className={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="font-bold">En attente</SelectItem>
                  <SelectItem value="partial" className="font-bold">Partiel</SelectItem>
                  <SelectItem value="paid" className="font-bold">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label className="font-black text-primary text-sm uppercase">Options supplémentaires</Label>
              <Input 
                value={newContract.additionalOptions || ''} 
                onChange={e => setNewContract({...newContract, additionalOptions: e.target.value})}
                placeholder="Ex: Siège bébé, GPS, Chauffeur..."
                className={inputStyle}
              />
            </div>
          </div>

          <Button onClick={handleCreate} className="w-full md:w-fit mt-8 h-12 px-16 font-black text-lg shadow-xl uppercase tracking-wider" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            GÉNÉRER LE CONTRAT DE LOCATION
          </Button>
        </CardContent>
      </Card>

      {/* Barre de recherche des contrats */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
        <Input 
          className="pl-10 h-12 border-2 border-primary/20 font-bold text-black text-lg" 
          placeholder="Rechercher un contrat (N°, client, véhicule)..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Liste des contrats */}
      <div className="space-y-4">
        <h3 className="font-black text-xl text-primary uppercase">Historique des Locations</h3>
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-4 text-left font-black text-primary uppercase">N° Contrat</th>
                  <th className="p-4 text-left font-black text-primary uppercase">Client</th>
                  <th className="p-4 text-left font-black text-primary uppercase">Véhicule</th>
                  <th className="p-4 text-left font-black text-primary uppercase">Durée</th>
                  <th className="p-4 text-left font-black text-primary uppercase">Montant</th>
                  <th className="p-4 text-left font-black text-primary uppercase">Statut</th>
                  <th className="p-4 text-right font-black text-primary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredContracts.map(contract => {
                  const vehicle = vehicles.find(v => v.id === contract.vehicleId);
                  const client = clients.find(c => c.id === contract.clientId);
                  return (
                    <tr key={contract.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-black text-primary">{contract.contractNumber}</td>
                      <td className="p-4 font-bold">{contract.clientName}</td>
                      <td className="p-4 font-medium">{contract.vehicleDetails}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-bold">
                          <Calendar className="w-4 h-4 text-primary" />
                          {contract.totalDays} jours
                        </div>
                      </td>
                      <td className="p-4 font-black text-primary text-base">
                        {contract.totalAmount?.toLocaleString()} FCFA
                      </td>
                      <td className="p-4">
                        <Badge className="font-black px-3 py-1">
                          {contract.status === 'active' ? 'ACTIF' : 'TERMINÉ'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="hover:bg-primary/10 text-primary" onClick={() => {
                          if (vehicle && client) {
                            generateRentalContractPDF(contract, vehicle, client);
                          } else {
                            toast.error("Impossible de générer le PDF : données manquantes");
                          }
                        }}>
                          <Download className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => {
                          if(confirm("Supprimer définitivement ce contrat ?")) onDelete(contract.id);
                        }}>
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground font-bold">
                      Aucun contrat de location trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};