'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/utils/supabase/client'
import { supabase } from '@/lib/supabase'
import { Product, Order } from '@/utils/supabase/types'
import { Bell, X, CheckCircle, Package } from 'lucide-react'

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
  const [isDark, setIsDark] = useState(true)
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null)
  
  // 🔥 NOUVEAUX STATES NOTIFICATIONS
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true)

  // 🔥 1️⃣ NOTIFICATION SYSTÈME + PERMISSION
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    console.log('🔔 Permission:', permission)
    setNotificationPermission(permission as any)
    setShowPermissionPrompt(false)
  }, [])

  const showSystemNotification = useCallback(async (title: string, message: string) => {
    console.log('🔔 TRIGGER:', title, message)
    
    // ✅ UNIQUEMENT si permission accordée
    if (notificationPermission === 'granted' && 'Notification' in window) {
      console.log('✅ ENVOI NATIVE')
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'order-notification'
      })
    }

    // ✅ TOAST toujours
    setNotification({ title, message })
    setTimeout(() => setNotification(null), 5000)
  }, [notificationPermission])

  // 🔥 2️⃣ REALTIME NOTIFICATIONS
  const setupRealtimeNotifications = useCallback(() => {
    if (!client?.id) return () => {}

    console.log('🔌 Realtime client_id:', client.id)

    const channel = supabase
      .channel(`client:${client.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `client_id=eq.${client.id}`
        },
        (payload) => {
          console.log('🎉 MON CLIENT !', payload.new)
          
          const orderId = payload.new.id
          const orderStatus = payload.new.status
          
          if (payload.eventType === 'INSERT') {
            showSystemNotification(
              '✅ Nouvelle Commande !',
              `Commande #${orderId} créée`
            )
          } else if (payload.eventType === 'UPDATE') {
            const oldStatus = payload.old?.status
            if (oldStatus !== orderStatus) {
              showSystemNotification(
                `📦 ${orderStatus.toUpperCase()} !`,
                `Commande #${orderId} → ${orderStatus}`
              )
            }
          }
        }
      )
      .subscribe(status => console.log('📡 Statut:', status))

    return () => supabase.removeChannel(channel)
  }, [client?.id, showSystemNotification])

  // 🔥 VÉRIFIER PERMISSION au chargement
  // REMPLACEZ useEffect permission par :
useEffect(() => {
  console.log('🔍 CHECK PERMISSION au démarrage')
  if ('Notification' in window) {
    const perm = Notification.permission as 'default' | 'granted' | 'denied'
    console.log('🔍 Permission trouvée:', perm)
    setNotificationPermission(perm)
    
    // ✅ FORCE PROMPT si default ou denied
    if (perm === 'default' || perm === 'denied') {
      setShowPermissionPrompt(true)
      console.log('✅ BOUTON PROMPT ACTIVÉ')
    }
  }
}, [])


  // 🔥 3️⃣ LOAD DATA + REALTIME
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, ordersData] = await Promise.all([
          db.getProducts(merchantId),
          db.getOrders(merchantId)
        ])
        const filteredOrders = ordersData.filter(order => String(order.client_id) === String(client.id))
        setProducts(productsData.filter(p => p.active))
        setOrders(filteredOrders)
      } catch (error) {
        console.error('❌ Erreur loadData:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const realtimeCleanup = setupRealtimeNotifications()

    // Thème
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }

    return () => realtimeCleanup()
  }, [merchantId, client.id, setupRealtimeNotifications])

  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) return
    setLoading(true)
    try {
      const promises = Object.entries(cart).map(([productId, quantity]) => 
        db.createOrder({ client_id: client.id, merchant_id: merchantId, product_id: productId, quantity, status: 'pending' })
      )
      await Promise.all(promises)
      setCart({})
      alert('Commande envoyée ! En attente de validation...')
      // Force refresh
      window.location.reload()
    } catch (error) {
      alert('Erreur lors de la commande')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value)

  if (loading && products.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center dark:bg-black">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white p-4 lg:p-8 transition-colors">
      
      {/* 🔔 PROMPT PERMISSION WHATSAPP (NOUVEAU) */}
      {showPermissionPrompt && notificationPermission === 'default' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] bg-gradient-to-r from-emerald-500 to-blue-600 text-white p-6 rounded-3xl shadow-2xl max-w-md mx-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <Bell className="w-8 h-8 animate-pulse" />
            <div>
              <h3 className="font-black text-xl">Activer les notifications ?</h3>
              <p className="text-sm opacity-90">Recevez vos mises à jour commande instantanément</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/20">
            <button 
              onClick={() => setShowPermissionPrompt(false)}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-2xl py-3 font-bold text-sm uppercase tracking-wider hover:bg-white/30 transition-all"
            >
              Plus tard
            </button>
            <button 
              onClick={requestNotificationPermission}
              className="flex-1 bg-white text-emerald-600 rounded-2xl py-3 font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Activer
            </button>
          </div>
        </div>
      )}

      {/* 🔔 NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-right-10 duration-300">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-5 rounded-3xl shadow-2xl flex items-start gap-4 max-w-sm border border-white/20 backdrop-blur-sm">
            <div className="bg-white/20 p-2 rounded-xl flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-xs uppercase tracking-widest mb-1">{notification.title}</p>
              <p className="text-sm opacity-90 leading-tight">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="opacity-50 hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center pb-6 border-b dark:border-[#1f1f1f]">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Mon Espace</h1>
          <button onClick={onLogout} className="text-[10px] font-bold text-red-500 uppercase border border-red-500/20 px-4 py-2 rounded-full hover:bg-red-500/10 transition-colors">
            Quitter
          </button>
        </header>

        {/* Onglets */}
        <div className="flex bg-slate-100 dark:bg-[#0A0A0A] p-1 rounded-2xl w-fit border dark:border-[#1f1f1f]">
          <button 
            onClick={() => setActiveTab('shop')} 
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'shop' ? 'bg-white dark:bg-[#1f1f1f] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Boutique
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab === 'orders' ? 'bg-white dark:bg-[#1f1f1f] shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Commandes ({orders.length})
          </button>
        </div>

        {/* Contenu onglets */}
        {activeTab === 'shop' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-slate-50 dark:bg-[#050505] border dark:border-[#1f1f1f] p-5 rounded-[2rem] flex flex-col group hover:shadow-xl transition-all">
                <div className="h-40 bg-slate-200 dark:bg-[#0A0A0A] rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform">
                  📦
                </div>
                <h3 className="font-bold mb-1 text-lg">{product.name}</h3>
                <p className="text-emerald-500 font-black mb-4 text-xl">{formatCurrency(product.price)}</p>
                <button 
                  onClick={() => setCart(prev => ({...prev, [product.id]: (prev[String(product.id)] || 0) + 1}))}
                  className="mt-auto w-full bg-slate-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest group-hover:bg-emerald-500 group-hover:dark:bg-emerald-400 transition-all"
                >
                  Ajouter
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#050505] border dark:border-[#1f1f1f] rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y dark:divide-[#1f1f1f]">
                {orders.map(order => {
                  const p = products.find(prod => String(prod.id) === String(order.product_id))
                  return (
                    <tr key={order.id} className="hover:bg-slate-100 dark:hover:bg-[#0A0A0A] transition-colors">
                      <td className="p-6">
                        <p className="font-bold text-sm">{p?.name || 'Produit'}</p>
                        <p className="text-[10px] text-slate-400">Quantité: {order.quantity}</p>
                      </td>
                      <td className="p-6 text-right">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 
                          order.status === 'validated' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
                          'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Aucune commande pour le moment</p>
              </div>
            )}
          </div>
        )}

        {/* Panier Flottant */}
        {Object.keys(cart).length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center z-50 backdrop-blur-sm">
            <div>
              <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Total</p>
              <p className="text-xl font-black">
                {formatCurrency(Object.entries(cart).reduce((t, [id, q]) => t + (products.find(p => String(p.id) === id)?.price || 0) * q, 0))}
              </p>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={loading}
              className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Commander'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
