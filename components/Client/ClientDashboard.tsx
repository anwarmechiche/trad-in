'use client'

import { useState, useEffect } from 'react'
import { db } from '@/utils/supabase/client'
import { Product, Order } from '@/utils/supabase/types'

interface ClientDashboardProps {
  client: any
  merchantId: string
  onLogout: () => void
}

export default function ClientDashboard({ client, merchantId, onLogout }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState('shop')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(true) // État pour l'icône

  // 1. GESTION DU THÈME AU CHARGEMENT
  useEffect(() => {
    loadData()
    // Vérifier si un thème est déjà enregistré
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [merchantId])

  // 2. FONCTION POUR CHANGER LE THÈME
  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsData, ordersData] = await Promise.all([
        db.getProducts(merchantId),
        db.getOrders(merchantId).then(orders => 
          orders.filter(order => order.client_id === client.id)
        )
      ])
      setProducts(productsData.filter(p => p.active))
      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (productId: string, quantity: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + quantity
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const cartTotal = Object.entries(cart).reduce((total, [productId, quantity]) => {
    const product = products.find(p => p.id === productId)
    return total + (quantity * (product?.price || 0))
  }, 0)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black transition-colors">
        <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-300 p-4 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tighter uppercase">Boutique</h1>
            {/* BOUTON CORRIGÉ */}
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#2f2f2f] hover:scale-110 transition-all active:scale-90"
              title="Changer de mode"
            >
              <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Navigation Tab */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#1f1f1f] rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'shop'
                ? 'bg-white dark:bg-[#1f1f1f] text-black dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-gray-500'
            }`}
          >
            Produits
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-[#1f1f1f] text-black dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-gray-500'
            }`}
          >
            Commandes
          </button>
        </div>

        {/* Grille de Produits */}
        {activeTab === 'shop' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-[#1f1f1f] rounded-3xl p-6 hover:border-emerald-500/40 transition-all flex flex-col group"
              >
                <div className="h-44 bg-slate-200 dark:bg-[#0A0A0A] rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-105 transition-transform">
                  📦
                </div>
                <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-500 mb-4 tracking-tight">
                  {formatCurrency(product.price)}
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-8 line-clamp-2 h-8">
                  {product.description || 'Description indisponible.'}
                </p>
                
                <div className="flex gap-2 mt-auto">
                  <input
                    type="number"
                    min="1"
                    id={`qty-${product.id}`}
                    defaultValue="1"
                    className="w-14 bg-white dark:bg-black border border-slate-200 dark:border-[#1f1f1f] rounded-xl text-center text-xs font-bold focus:border-emerald-500 outline-none"
                  />
                  <button
                    onClick={() => {
                        const qtyInput = document.getElementById(`qty-${product.id}`) as HTMLInputElement;
                        addToCart(product.id, parseInt(qtyInput.value) || 1);
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Tableau Commandes */
          <div className="bg-slate-50 dark:bg-[#050505] border border-slate-200 dark:border-[#1f1f1f] rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#0A0A0A] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-200 dark:border-[#1f1f1f]">
                  <th className="p-6">Produit</th>
                  <th className="p-6 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1f1f1f]">
                {orders.map((order) => {
                  const product = products.find(p => p.id === order.product_id);
                  return (
                    <tr key={order.id} className="hover:bg-white dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-sm">{product?.name || 'Produit'}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          ID-{String(order.product_id).slice(0, 5)}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          order.status === 'delivered' 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                        }`}>
                          {order.status === 'delivered' ? 'Livrée' : 'Attente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Panier Flottant */}
        {Object.keys(cart).length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl border border-slate-200 dark:border-[#1f1f1f] shadow-2xl rounded-[2.5rem] p-6 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Total</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(cartTotal)}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCart({})}
                  className="px-4 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase"
                >
                  Vider
                </button>
                <button className="bg-emerald-600 dark:bg-white text-white dark:text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-transform active:scale-95">
                  Commander
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}