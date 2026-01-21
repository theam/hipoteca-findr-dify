import { NextResponse } from 'next/server';

// Proxy para BCE Euribor API
// Endpoint original: https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA

const BCE_API_BASE = 'https://data-api.ecb.europa.eu/service';

export async function GET(request: Request) {
    try {
          const { searchParams } = new URL(request.url);

      // Construir URL con parámetros de consulta
      const params = new URLSearchParams();
          searchParams.forEach((value, key) => {
                  params.append(key, value);
          });

      const queryString = params.toString();
          const url = `${BCE_API_BASE}/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA${queryString ? `?${queryString}` : ''}`;

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

      return NextResponse.json(data, {
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
