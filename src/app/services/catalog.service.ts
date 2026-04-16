import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';

// Resposta padrão paginada do nosso backend
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

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
  price: number; // No front podemos tratar Decimal como number e formatar no pipe
  cost_price?: number;
  stock_qty: number;
  stock_min: number;
  category_id: string;
  is_active: boolean;
  category?: Category;
  barcodes?: ProductBarcode[];
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

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private http = inject(HttpClient);
  // Recomendo mover isso para o environment.ts futuramente
  private apiUrl = environment.apiUrl; 

  // ==========================================
  // CATEGORIAS
  // ==========================================
  
  getCategories(filters?: any): Observable<Category[]> {
    let params = new HttpParams();
    if (filters?.name) params = params.set('name', filters.name);
    
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { params });
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: string, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`);
  }

  // ==========================================
  // PRODUTOS & ESTOQUE
  // ==========================================

  getProducts(filters?: any): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.name) params = params.set('name', filters.name);
    if (filters?.category_id) params = params.set('category_id', filters.category_id);
    
    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductByBarcode(code: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/barcode/${code}`);
  }

  getLowStockAlerts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/low-stock`);
  }

  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: string, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, data);
  }

  pauseProduct(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/products/${id}/pause`, {});
  }

  updateStock(id: string, data: StockMovementParams): Observable<any> {
    return this.http.patch(`${this.apiUrl}/products/${id}/stock`, data);
  }

  // ==========================================
  // KITS PROMOCIONAIS
  // ==========================================

  getPromoKits(): Observable<PromoKit[]> {
    return this.http.get<PromoKit[]>(`${this.apiUrl}/promo-kits`);
  }

  createPromoKit(data: any): Observable<PromoKit> {
    // Data pode ser FormData se tiver upload de arquivo físico, 
    // ou JSON normal se as imagens já vierem como URL (S3, Firebase, etc)
    return this.http.post<PromoKit>(`${this.apiUrl}/promo-kits`, data);
  }
}