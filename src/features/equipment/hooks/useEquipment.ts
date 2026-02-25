import { useEffect, useState } from "react";
import { apiFetch } from "@/app/api";
import type { Campaign } from "@/shared/types/campaign.types";
import { ApiError } from "@/app/api"
import type { CampaignFormData } from "@/features/campaign/components/CampaignForm/CampaignForm";

export function useEquipment(filters?: {
  campaignId?: string;
}) {
  const [equipment, setEquipment] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, [filters?.campaignId]);
  

  async function fetchEquipment() {
    const params = new URLSearchParams()

    if (filters?.campaignId) params.append("campaignId", filters.campaignId);
  
    try {
      const data = await apiFetch<{ equipment: Campaign[] }>(`/api/equipment?${params.toString()}`);
      setEquipment(data.equipment ?? []);
    } catch (err) {
      setError("Failed to load equipment");
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }

  async function createEquipment(data: CampaignFormData) {
    try {
      setCreating(true);
      await apiFetch("/api/campaigns", {
        method: "POST",
        body: data,
      });

      await fetchEquipment(); // refresh list
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create campaign"
      );
      throw err; // allow UI to react if needed
    } finally {
      setCreating(false);
    }
  }

  return {
    equipment,
    loading,
    creating,
    error,
    createEquipment,
    refetch: fetchEquipment,
  };
}
