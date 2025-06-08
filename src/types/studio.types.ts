export interface Studio {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string;
  description: string | null;
  opening_hours: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateStudioInput {
  name?: string;
  address?: string;
  phone?: string;
  description?: string;
  opening_hours?: string;
  logo_url?: string;
}
