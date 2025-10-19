import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://server.korakagazindia.com';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    const targetUrl = `${API_BASE_URL}/api/products${queryString}`;
    
    console.log(`🔄 Proxying GET request to: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log(`✅ Proxy response: ${response.status} ${response.statusText}`);
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('🚨 Proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
