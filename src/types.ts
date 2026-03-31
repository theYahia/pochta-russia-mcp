export interface PochtaTrackingEvent {
  AddressParameters?: {
    MailDirect?: { NameRU: string };
    DestinationAddress?: { Description: string };
    OperationAddress?: { Description: string };
  };
  OperationParameters?: {
    OperType?: { Name: string; Id: number };
    OperAttr?: { Name: string; Id: number };
    OperDate: string;
  };
  ItemParameters?: {
    Barcode: string;
    Mass: number;
  };
  FinanceParameters?: {
    Value: number;
    MassRate: number;
  };
}

export interface PochtaCalcResult {
  total_rate?: number;
  total_nds?: number;
  ground_rate?: {
    rate: number;
    vat: number;
  };
  delivery_time?: {
    min_days: number;
    max_days: number;
  };
  payment_method?: number;
  notice?: string;
}

export interface PochtaOffice {
  postal_code: string;
  oper_date?: string;
  address?: {
    address_type: string;
    area: string;
    index: string;
    location: string;
    num_address_type?: string;
    place: string;
    region: string;
  };
  latitude?: number;
  longitude?: number;
  work_time?: string;
  phones?: Array<{ phone_number: string; phone_type?: string }>;
  type_code?: string;
  ecom_options?: {
    card_payment: boolean;
    cash_payment: boolean;
    contentsChecking: boolean;
    functionalityChecking: boolean;
    partialRedemption: boolean;
    withFitting: boolean;
  };
}

export interface PochtaError {
  code?: string;
  sub_code?: string;
  desc?: string;
  message?: string;
}
