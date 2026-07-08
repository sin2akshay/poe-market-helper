import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CurrencyResponse,
  FlipsResponse,
  HistoryPoint,
  Insights,
  ItemResponse,
  Meta,
  Summary
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<Summary> {
    return this.http.get<Summary>(`${this.base}/summary`);
  }

  getMeta(): Observable<Meta> {
    return this.http.get<Meta>(`${this.base}/meta`);
  }

  getInsights(): Observable<Insights> {
    return this.http.get<Insights>(`${this.base}/insights`);
  }

  getCurrency(type?: string): Observable<CurrencyResponse> {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.http.get<CurrencyResponse>(`${this.base}/currency${q}`);
  }

  getCurrencyHistory(id: string): Observable<{ itemId: string; points: HistoryPoint[] }> {
    return this.http.get<{ itemId: string; points: HistoryPoint[] }>(
      `${this.base}/currency/history?id=${encodeURIComponent(id)}`
    );
  }

  getItems(opts: {
    type?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    limit?: number;
    maxListings?: number;
  }): Observable<ItemResponse> {
    const params = new URLSearchParams();
    if (opts.type) params.set('type', opts.type);
    if (opts.sort) params.set('sort', opts.sort);
    if (opts.dir) params.set('dir', opts.dir);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.maxListings) params.set('maxListings', String(opts.maxListings));
    return this.http.get<ItemResponse>(`${this.base}/items?${params.toString()}`);
  }

  getItemHistory(itemId: string): Observable<{ itemId: string; points: HistoryPoint[] }> {
    return this.http.get<{ itemId: string; points: HistoryPoint[] }>(
      `${this.base}/items/history?id=${encodeURIComponent(itemId)}`
    );
  }

  getFlips(opts: {
    minChange?: number;
    maxListings?: number;
    minListings?: number;
    minVolume?: number;
    limit?: number;
  }): Observable<FlipsResponse> {
    const params = new URLSearchParams();
    if (opts.minChange !== undefined) params.set('minChange', String(opts.minChange));
    if (opts.maxListings !== undefined) params.set('maxListings', String(opts.maxListings));
    if (opts.minListings !== undefined) params.set('minListings', String(opts.minListings));
    if (opts.minVolume !== undefined) params.set('minVolume', String(opts.minVolume));
    if (opts.limit !== undefined) params.set('limit', String(opts.limit));
    return this.http.get<FlipsResponse>(`${this.base}/flips?${params.toString()}`);
  }
}
