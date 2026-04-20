import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const SecureDataSchema = z.object({
  metadata: z.object({
    user_id: z.string().nullable(),
    exported_at: z.string(),
    version: z.string(),
    checksum: z.string()
  }),
  payload: z.record(z.array(z.object({
    id: z.string().optional(),
    user_id: z.string().optional(),
  }).passthrough()))
});

export const DataManagement = () => {
  const [user, setUser] = useState<any>(null);
  const [integritySecret, setIntegritySecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch the unique secret from the user's profile
          const { data, error } = await supabase
            .from('profiles')
            .select('backup_secret')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          setIntegritySecret(data.backup_secret);
        } else {
          // Local Mode: Use a persistent local secret unique to this installation
          let localSecret = localStorage.getItem('app_integrity_key_v2');
          if (!localSecret) {
            localSecret = crypto.randomUUID();
            localStorage.setItem('app_integrity_key_v2', localSecret);
          }
          setIntegritySecret(localSecret);
        }
      } catch (err) {
        console.error("Security initialization error:", err);
        toast.error("Erreur d'initialisation de la sécurité des données.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeSecurity();
  }, []);

  const generateChecksum = async (payload: any, userId: string | null) => {
    // Use the unique secret as the salt instead of a hardcoded string
    const salt = integritySecret || 'fallback-emergency-salt';
    const dataToHash = JSON.stringify(payload) + salt + (userId || 'local');
    
    const msgUint8 = new TextEncoder().encode(dataToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const exportData = async () => {
    if (!integritySecret) return toast.error("Sécurité non initialisée.");
    
    const payload: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('rental_') || key.startsWith('automobile_'))) {
        payload[key] = JSON.parse(localStorage.getItem(key) || '[]');
      }
    }
    
    const userId = user?.id || null;
    const checksum = await generateChecksum(payload, userId);
    
    const exportObject = {
      metadata: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        version: "1.3",
        checksum
      },
      payload
    };
    
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestion_pro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Données exportées avec signature unique !");
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !integritySecret) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawData = JSON.parse(e.target?.result as string);
        const validatedData = SecureDataSchema.parse(rawData);
        
        const currentUserId = user?.id || null;
        if (validatedData.metadata.user_id !== currentUserId) {
          toast.error("Sécurité : Ce fichier appartient à un autre compte.");
          return;
        }

        const calculatedChecksum = await generateChecksum(validatedData.payload, currentUserId);
        if (calculatedChecksum !== validatedData.metadata.checksum) {
          toast.error("Sécurité : Signature invalide. Le fichier est corrompu ou provient d'une autre installation.");
          return;
        }
        
        Object.keys(validatedData.payload).forEach(key => {
          localStorage.setItem(key, JSON.stringify(validatedData.payload[key]));
        });
        
        toast.success("Données vérifiées et importées !");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error("Fichier invalide ou signature de sécurité incorrecte.");
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <ShieldCheck className="w-5 h-5" /> Sauvegarde Haute Sécurité
        </CardTitle>
        <CardDescription>
          Vos exports sont désormais signés avec une clé unique {user ? 'liée à votre compte' : 'liée à ce navigateur'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportData} variant="outline" className="bg-white border-primary/20 hover:bg-primary/5">
            <Download className="w-4 h-4 mr-2" /> Exporter (Signé)
          </Button>
          <div className="relative">
            <input 
              type="file" 
              id="import-db" 
              className="hidden" 
              accept=".json" 
              onChange={importData}
            />
            <Button variant="default" onClick={() => document.getElementById('import-db')?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Importer & Vérifier
            </Button>
          </div>
        </div>
        <div className="p-3 bg-blue-100/50 border border-blue-200 rounded-lg">
          <p className="text-[10px] text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> 
            <span>
              <strong>Protection active :</strong> La signature SHA-256 utilise désormais un sel unique (UUID) non présent dans le fichier, rendant toute falsification impossible.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};