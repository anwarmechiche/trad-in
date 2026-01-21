import { supabase } from '@/lib/supabase'

export interface Merchant {
  id: string
  merchant_id: string
  name: string
  password: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  merchant_id: string
  client_id: string
  name: string
  password: string
  email?: string
  phone?: string
  address?: string
  city?: string
  zip?: string
  wilaya?: string
  payment_mode?: string
  credit_limit?: number
  fiscal_number?: string
  notes?: string
  active: boolean
  show_price: boolean
  show_quantity: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  merchant_id: string
  name: string
  price: number
  description?: string
  image_data?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  merchant_id: string
  client_id: string
  product_id: string
  quantity: number
  status: 'pending' | 'delivered'
  created_at: string
  updated_at: string
}

export class SupabaseClient {
  async loginMerchant(merchantId: string, password: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('password', password)
      .single()

    if (error || !data) return null
    return data
  }

  async loginClient(clientId: string, password: string, merchantId: string): Promise<Client | null> {
    try {
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('merchant_id', merchantId)
        .single()

      if (merchantError || !merchantData) return null

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .eq('password', password)
        .eq('merchant_id', merchantData.id)
        .single()

      if (error || !data) return null
      return data
    } catch (error) {
      console.error('Login client error:', error)
      return null
    }
  }

  async getProducts(merchantId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get products error:', error)
      return []
    }
    return data || []
  }

  async getClients(merchantId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get clients error:', error)
      return []
    }
    return data || []
  }

  async getOrders(merchantId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get orders error:', error)
      return []
    }
    return data || []
  }

  // AJOUTEZ CES FONCTIONS POUR QUE "VOIR" FONCTIONNE :

  async getProductById(id: string): Promise<Product | null> {
    try {
      console.log('Recherche produit ID:', id)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erreur getProductById:', error)
        return null
      }
      
      console.log('Produit trouvé:', data)
      return data
    } catch (error) {
      console.error('Exception getProductById:', error)
      return null
    }
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      console.log('Recherche client ID:', id)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erreur getClientById:', error)
        return null
      }
      
      console.log('Client trouvé:', data)
      return data
    } catch (error) {
      console.error('Exception getClientById:', error)
      return null
    }
  }

  // AJOUTEZ AUSSI CES FONCTIONS POUR LES AUTRES OPÉRATIONS :

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Create product error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Create product exception:', error)
      return null
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update product error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Update product exception:', error)
      return null
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete product error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Delete product exception:', error)
      return false
    }
  }

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...client,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Create client error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Create client exception:', error)
      return null
    }
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Update client error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Update client exception:', error)
      return null
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete client error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Delete client exception:', error)
      return false
    }
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...order,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Create order error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Create order exception:', error)
      return null
    }
  }

  async createMerchant(merchant: Omit<Merchant, 'id' | 'created_at' | 'updated_at'>): Promise<Merchant | null> {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .insert([{
          ...merchant,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Create merchant error:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Create merchant exception:', error)
      return null
    }
  }
}

export const db = new SupabaseClient()