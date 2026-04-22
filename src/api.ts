const API_BASE = '/api';

async function fetchJSON(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    
    if (!res.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error(`Expected JSON from ${url} but got:`, text.substring(0, 100));
      throw new Error('Server returned an invalid response (not JSON). This usually means the API route was not found.');
    }

    return res.json();
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  auth: {
    login: async (credentials: any) => {
      return fetchJSON(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
    },
    register: async (data: any) => {
      return fetchJSON(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  },
  company: {
    get: async (companyId: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}`);
    },
    update: async (companyId: string, data: any) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  },
  products: {
    list: async (companyId: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/products`);
    },
    create: async (companyId: string, data: any) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    update: async (companyId: string, productId: string, data: any) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    delete: async (companyId: string, productId: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      });
    }
  },
  sales: {
    list: async (companyId: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/sales`);
    },
    create: async (companyId: string, data: any) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  },
  staff: {
    list: async (companyId: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/staff`);
    },
    create: async (data: any) => {
      return fetchJSON(`${API_BASE}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  },
  users: {
    update: async (uid: string, data: any) => {
      return fetchJSON(`${API_BASE}/users/${encodeURIComponent(uid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  },
  generic: {
    list: async (companyId: string, collection: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/${encodeURIComponent(collection)}`);
    },
    create: async (companyId: string, collection: string, data: any) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/${encodeURIComponent(collection)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    update: async (companyId: string, collection: string, id: string, data: any) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    delete: async (companyId: string, collection: string, id: string) => {
      return fetchJSON(`${API_BASE}/companies/${encodeURIComponent(companyId)}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    }
  }
};
