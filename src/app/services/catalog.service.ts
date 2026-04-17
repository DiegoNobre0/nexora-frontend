import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/environment';
import { Category, PaginatedResponse, Product, PromoKit, StockMovementParams } from '../interfaces/catalog.interface';

// Resposta padrão paginada do nosso backend

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

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
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

  updatePromoKit(id: string, data: any): Observable<any> {
    // Usamos PUT porque vamos atualizar o registro existente no backend
    return this.http.put<any>(`${this.apiUrl}/promo-kits/${id}`, data);
  }
}