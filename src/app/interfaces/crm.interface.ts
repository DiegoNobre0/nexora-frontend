export interface Client {
  id: string;
  name: string;
  phone: string;
  company_name: string;
  type: 'INDIVIDUAL' | 'COMPANY';
}