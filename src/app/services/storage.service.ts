import { Injectable } from '@angular/core';

import type { Incidencia } from '../models/incidencia.model';

type BorradorIncidencia = Partial<Omit<Incidencia, 'id'>>;

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly claveSeguimiento = 'seguimiento_ids';
  private readonly claveBorrador = 'borrador_incidencia';

  guardarCodigoSeguimiento(codigo: string): void {
    const codigos = new Set(this.obtenerCodigosSeguimiento());
    codigos.add(codigo);
    localStorage.setItem(this.claveSeguimiento, JSON.stringify([...codigos]));
  }

  obtenerCodigosSeguimiento(): string[] {
    const almacenado = localStorage.getItem(this.claveSeguimiento);
    if (almacenado === null) {
      return [];
    }

    const codigos: unknown = JSON.parse(almacenado);
    if (!Array.isArray(codigos) || !codigos.every((codigo): codigo is string => typeof codigo === 'string')) {
      throw new Error(`El contenido de "${this.claveSeguimiento}" no es una lista de códigos válida.`);
    }

    return codigos;
  }

  estaEnSeguimiento(codigo: string): boolean {
    return this.obtenerCodigosSeguimiento().includes(codigo);
  }

  eliminarCodigoSeguimiento(codigo: string): void {
    const codigos = this.obtenerCodigosSeguimiento().filter((actual) => actual !== codigo);
    localStorage.setItem(this.claveSeguimiento, JSON.stringify(codigos));
  }

  guardarBorrador(borrador: BorradorIncidencia): void {
    localStorage.setItem(this.claveBorrador, JSON.stringify(borrador));
  }

  obtenerBorrador(): BorradorIncidencia | null {
    const almacenado = localStorage.getItem(this.claveBorrador);
    if (almacenado === null) {
      return null;
    }

    const borrador: unknown = JSON.parse(almacenado);
    if (typeof borrador !== 'object' || borrador === null || Array.isArray(borrador)) {
      throw new Error(`El contenido de "${this.claveBorrador}" no es un borrador válido.`);
    }

    return borrador as BorradorIncidencia;
  }

  limpiarBorrador(): void {
    localStorage.removeItem(this.claveBorrador);
  }
}
