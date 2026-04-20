import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

// Utilitaires pour la conversion de casse
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const mapKeys = (obj: any, fn: (key: string) => string) => {
  if (!obj || typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(v => mapKeys(v, fn));
  return Object.keys(obj).reduce((acc, key) => {
    acc[fn(key)] = mapKeys(obj[key], fn);
    return acc;
  }, {} as any);
};

export function useSupabaseData<T extends { id?: string }>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { session: authSession } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData = (result || []).map(item => mapKeys(item, toCamelCase));
      setData(mappedData);
    } catch (error: any) {
      console.error(`[useSupabaseData] Error fetching ${tableName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = async (item: any) => {
    try {
      // On récupère la session la plus récente directement depuis Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error("[useSupabaseData] Session invalide au moment de l'ajout", sessionError);
        toast.error("Votre session a expiré. Veuillez vous reconnecter.");
        return null;
      }

      const currentUserId = session.user.id;
      const dbItem = mapKeys(item, toSnakeCase);
      
      // On s'assure que l'user_id est bien présent pour passer les politiques RLS
      dbItem.user_id = currentUserId;

      console.log(`[useSupabaseData] Tentative d'ajout dans ${tableName} pour l'utilisateur ${currentUserId}`);

      const { data: result, error } = await supabase
        .from(tableName)
        .insert([dbItem])
        .select();

      if (error) {
        // Traduction manuelle si l'erreur est liée à l'auth
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Vous n'avez pas les permissions nécessaires ou votre session est invalide.");
        }
        throw error;
      }
      
      const newItem = mapKeys(result[0], toCamelCase);
      setData(prev => [newItem, ...prev]);
      toast.success("Enregistré avec succès");
      return newItem;
    } catch (error: any) {
      console.error(`[useSupabaseData] Erreur lors de l'ajout dans ${tableName}:`, error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Session expirée. Action impossible.");
        return null;
      }

      const dbUpdates = mapKeys(updates, toSnakeCase);
      const { data: result, error } = await supabase
        .from(tableName)
        .update(dbUpdates)
        .eq('id', id)
        .select();

      if (error) throw error;
      const updatedItem = mapKeys(result[0], toCamelCase);
      setData(prev => prev.map(item => item.id === id ? updatedItem : item));
      toast.success("Mis à jour");
      return updatedItem;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Session expirée. Action impossible.");
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      toast.success("Supprimé");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  return { data, setData, loading, addItem, updateItem, deleteItem, refresh: fetchData };
}