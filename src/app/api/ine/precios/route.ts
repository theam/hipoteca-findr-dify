import { NextResponse } from 'next/server';

// Proxy para INE API - Índice de Precios de Vivienda
// Tabla 25171: Índices por CCAA: general, vivienda nueva y de segunda mano
// Limitado a últimos 3 periodos con ?nult=3

const INE_API_BASE = 'https://servicios.ine.es/wstempus/js/ES';

export async function GET() {
    try {
          const response = await fetch(`${INE_API_BASE}/DATOS_TABLA/25171?nult=3`, {
                  headers: {
                            'Accept': 'application/json',
                  },
                  next: { revalidate: 86400 } // Cache por 24 horas
          });

      if (!response.ok) {
              return NextResponse.json(
                { error: `INE API error: ${response.status}` },
                { status: response.status }
                      );
      }

      const data = await response.json();

      return NextResponse.json(data, {
              headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
              },
      });
    } catch (error) {
          console.error('Error fetching INE housing price data:', error);
          return NextResponse.json(
            { error: 'Failed to fetch housing price data' },
            { status: 500 }
                );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
          headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type',
          },
    });
}
