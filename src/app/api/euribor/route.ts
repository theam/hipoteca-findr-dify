import { NextResponse } from 'next/server';

// Proxy para BCE Euribor API
// Endpoint original: https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA

const BCE_API_BASE = 'https://data-api.ecb.europa.eu/service';

export async function GET() {
    try {
      const url = `${BCE_API_BASE}/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA?lastNObservations=3`;

      const response = await fetch(url, {
              headers: {
                        'Accept': 'application/json',
              },
              next: { revalidate: 3600 } // Cache por 1 hora
      });

      if (!response.ok) {
              return NextResponse.json(
                { error: `BCE API error: ${response.status}` },
                { status: response.status }
                      );
      }

      const data = await response.json();

      // Extraer solo los valores relevantes para un JSON ligero
      const timePeriods = data?.structure?.dimensions?.observation?.[0]?.values || [];
      const observations = data?.dataSets?.[0]?.series?.['0:0:0:0:0:0:0']?.observations || {};

      const valores = Object.entries(observations).map(([idx, val]) => ({
          fecha: timePeriods[Number(idx)]?.id || null,
          valor: (val as number[])[0],
      }));

      const ultimo = valores[valores.length - 1];

      return NextResponse.json({
          euribor12m: ultimo?.valor ?? null,
          fecha: ultimo?.fecha ?? null,
          fuente: 'Banco Central Europeo',
          historico: valores,
      }, {
              headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
              },
      });
    } catch (error) {
          console.error('Error fetching Euribor data:', error);
          return NextResponse.json(
            { error: 'Failed to fetch Euribor data' },
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
