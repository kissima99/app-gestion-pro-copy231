import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle, RentalContract, SaleContract } from '../types/automobile';
import { Car, Calendar, DollarSign, ShieldAlert, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Props {
  vehicles: Vehicle[];
  rentalContracts: RentalContract[];
  saleContracts: SaleContract[];
}

export const AutomobileSummary = ({ vehicles, rentalContracts, saleContracts }: Props) => {
  // Statistiques des véhicules
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

  // Statistiques des contrats de location
  const activeRentals = rentalContracts.filter(c => c.status === 'active');
  const totalRentalRevenue = rentalContracts
    .filter(c => c.status === 'active' || c.status === 'completed')
    .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  // Statistiques des ventes
  const completedSales = saleContracts.filter(c => c.status === 'completed');
  const totalSalesRevenue = saleContracts
    .filter(c => c.status === 'completed')
    .reduce((acc, curr) => acc + (Number(curr.salePrice) || 0), 0);

  const totalRevenue = totalRentalRevenue + totalSalesRevenue;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Chiffres clés */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-blue-700 uppercase tracking-wider">Flotte Totale</p>
              <h3 className="text-2xl font-black text-blue-800 mt-1">{totalVehicles} Véhicules</h3>
              <p className="text-xs text-blue-600/80 mt-1 font-bold">
                {availableVehicles} dispo • {rentedVehicles} loués
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-2xl">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-green-700 uppercase tracking-wider">Revenus Locations</p>
              <h3 className="text-2xl font-black text-green-800 mt-1">{totalRentalRevenue.toLocaleString()} FCFA</h3>
              <p className="text-xs text-green-600/80 mt-1 font-bold">
                {activeRentals.length} contrat(s) actif(s)
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-2xl">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Revenus Ventes</p>
              <h3 className="text-2xl font-black text-amber-800 mt-1">{totalSalesRevenue.toLocaleString()} FCFA</h3>
              <p className="text-xs text-amber-600/80 mt-1 font-bold">
                {completedSales.length} véhicule(s) vendu(s)
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground shadow-xl hover:scale-[1.02] transition-transform">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Chiffre d'Affaires Global</p>
              <h3 className="text-2xl font-black mt-1">{totalRevenue.toLocaleString()} FCFA</h3>
              <p className="text-xs opacity-80 mt-1 font-bold">Cumul Locations + Ventes</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes opérationnelles */}
      {maintenanceVehicles > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-bold">
            Attention : <strong>{maintenanceVehicles} véhicule(s)</strong> sont actuellement en maintenance et indisponibles pour la location.
          </span>
        </div>
      )}
    </div>
  );
};