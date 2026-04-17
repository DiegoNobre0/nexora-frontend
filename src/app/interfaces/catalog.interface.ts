export interface Category {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    _count?: {
        products: number;
    };
}

export interface ProductBarcode {
    id: string;
    code: string;
    unit: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price: number;
    price_wholesale?: number;
    cost_price?: number;
    stock_qty: number;
    stock_min: number;
    unit?: string;
    ncm?: string;
    cfop?: string;
    category_id: string;
    is_active: boolean;
    category?: Category;
    barcodes?: ProductBarcode[];
    categories?: Category[];
}


export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


export interface PromoKitItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: { name: string };
}

export interface PromoKit {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  is_active: boolean;
  items?: PromoKitItem[];
}

export interface StockMovementParams {
  operation: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason?: string;
}

