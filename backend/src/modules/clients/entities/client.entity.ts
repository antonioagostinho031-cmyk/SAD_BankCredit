export class Client {
  id: string;
  user_id: string;
  full_name: string;
  bi_number: string;
  nif: string;
  date_of_birth: Date;
  marital_status: string;
  address: string;
  phone: string;
  email: string;
  employer: string;
  job_title: string;
  monthly_income: number;
  account_number: string;
  account_balance: number;
  registration_status: string;
  is_eligible_for_credit: boolean;
  account_manager_id: string;
  created_at: Date;
  updated_at: Date;
}

export class ClientAddress {
  id: string;
  client_id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  province: string;
  postal_code: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export class EmploymentData {
  id: string;
  client_id: string;
  employer_name: string;
  job_title: string;
  employment_type: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  monthly_income: number;
  created_at: Date;
  updated_at: Date;
}
