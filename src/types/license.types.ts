export interface License {
  id: string;
  studio_id: string;
  license_type: "monthly" | "yearly";
  start_date: string;
  end_date: string;
  is_active: boolean;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLicenseInput {
  license_type: "monthly" | "yearly";
  payment_reference?: string;
}
