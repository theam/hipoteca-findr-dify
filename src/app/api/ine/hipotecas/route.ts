import { NextResponse } from 'next/server';

// Proxy para INE API - Hipotecas constituidas
// Endpoint original: https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/HPT3459

const INE_API_BASE = 'https://servicios.ine.es/wstempus/js/ES';

export async function GET() {
    try {
          const response = await fetch(`${INE_API_BASE}/DATOS_SERIE/HPT3459`, {
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
          console.error('Error fetching INE mortgage data:', error);
          return NextResponse.json(
            { error: 'Failed to fetch mortgage data' },
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
