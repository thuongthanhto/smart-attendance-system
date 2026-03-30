export interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusM?: number;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radiusM?: number;
  isActive?: boolean;
}

export interface BranchWifi {
  id: string;
  branchId: string;
  bssid: string;
  description: string | null;
}

export interface CreateBranchWifiPayload {
  bssid: string;
  description?: string;
}
