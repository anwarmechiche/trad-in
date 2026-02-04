'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ShoppingBag, 
  RefreshCw, 
  ChevronRight, 
  X, 
  Printer, 
  Calendar, 
  MapPin, 
  Package, 
  User, 
  Filter,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  AlertCircle,
  Truck,
  BellRing
} from 'lucide-react'

interface OrdersPageProps {
  merchantId: string;
  products: any[];
  formatCurrency: (amount: number) => string;
}

export default function OrdersPage({ merchantId, products = [], formatCurrency }: OrdersPageProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const ITEMS_PER_PAGE = 8

  const statusOptions = [
    { value: 'all', label: 'Toutes', color: 'bg-gray-100 text-gray-700' },
    { value: 'pending', label: 'En attente', color: 'bg-amber-100 text-amber-700' },
    { value: 'processing', label: 'En cours', color: 'bg-blue-100 text-blue-700' },
    { value: 'delivered', label: 'Livré', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-700' }
  ]

  // 1. CHARGEMENT INITIAL
  useEffect(() => {
    if (merchantId) fetchOrders()
  }, [merchantId])

  // 2. ÉCOUTE TEMPS RÉEL DES NOUVELLES COMMANDES (Realtime)
  useEffect(() => {
    if (!merchantId) return

    const channel = supabase
      .channel('merchant-realtime-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`
        },
        async (payload) => {
          // Récupérer les infos du client pour avoir une carte complète
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', payload.new.client_id)
            .single()

          const newOrderWithClient = { ...payload.new, clients: clientData }

          // Ajouter en haut de liste et notifier
          setOrders(prev => [newOrderWithClient, ...prev])
          setNewOrderAlert(true)
          
          // Jouer un son (facultatif, nécessite un fichier dans /public)
          const audio = new Audio('/notification.mp3')
          audio.play().catch(() => console.log("Audio bloqué par le navigateur"))

          setTimeout(() => setNewOrderAlert(false), 8000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [merchantId])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('merchant_id', merchantId)

      if (clientsError) throw clientsError

      const ordersWithClients = ordersData?.map(order => ({
        ...order,
        clients: clientsData?.find(c => String(c.id) === String(order.client_id)) || null
      }))
      
      setOrders(ordersWithClients || [])
    } catch (err: any) {
      setError(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Envoyer la notification au client
      const statusLabels: any = { 'processing': 'préparée', 'delivered': 'livrée', 'cancelled': 'annulée' }
      await supabase.from('notifications').insert({
        client_id: selectedOrder.client_id,
        merchant_id: merchantId,
        title: "Statut de commande",
        message: `Votre commande #${String(orderId).slice(-5).toUpperCase()} est désormais ${statusLabels[newStatus] || newStatus}.`,
      })

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      setSelectedOrder(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const extractInfo = (order: any) => {
    if (!order) return {} as any;
    const clientName = order.clients?.name || `Client #${order.client_id}`
    const product = products.find(p => String(p.id) === String(order.product_id))
    const totalAmount = order.total_amount || (Number(order.quantity || 1) * Number(product?.price || 0))
    const status = order.status?.toLowerCase() || 'pending'
    
    return { 
      name: clientName, 
      amount: totalAmount, 
      status, 
      statusLabel: status === 'pending' ? 'En attente' : status === 'processing' ? 'En cours' : status === 'delivered' ? 'Livré' : 'Annulé',
      date: order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : "N/A",
      phone: order.clients?.phone || "N/A",
      city: order.clients?.city || "N/A",
      productName: product?.name || 'Produit inconnu',
      quantity: order.quantity || 1
    }
  }

  const filteredOrders = orders.filter(order => statusFilter === 'all' || extractInfo(order).status === statusFilter)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)

  if (loading && orders.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto space-y-8 relative">
      
      {/* --- ALERTE TEMPS RÉEL --- */}
      {newOrderAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10">
          <div className="bg-indigo-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20">
            <div className="bg-white/20 p-2 rounded-full animate-bounce"><BellRing className="w-5 h-5" /></div>
            <p className="font-bold text-sm">🔔 Nouvelle commande reçue à l'instant !</p>
            <button onClick={() => setNewOrderAlert(false)} className="hover:rotate-90 transition-transform"><X className="w-5 h-5"/></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
            <p className="text-sm text-gray-500">{filteredOrders.length} commande(s)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer"
            >
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <button onClick={fetchOrders} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedOrders.map(order => {
          const info = extractInfo(order)
          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="group bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-2xl hover:border-emerald-100 transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase">#{String(order.id).slice(-5)}</span>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${info.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                  {info.statusLabel}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 truncate">{info.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{info.productName}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <p className="text-lg font-black text-gray-900">{formatCurrency(info.amount)}</p>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 border rounded-xl disabled:opacity-20"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold">Page {currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 border rounded-xl disabled:opacity-20"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
      )}

      {/* Modal Détails */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black">Commande</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-xl shadow-sm"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] uppercase font-bold text-gray-400">Client</p><p className="font-bold">{extractInfo(selectedOrder).name}</p></div>
                <div className="text-right"><p className="text-[10px] uppercase font-bold text-gray-400">Ville</p><p className="font-bold">{extractInfo(selectedOrder).city}</p></div>
              </div>
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex justify-between items-center">
                <div><p className="font-bold">{extractInfo(selectedOrder).productName}</p><p className="text-xs text-emerald-600">Qté: {extractInfo(selectedOrder).quantity}</p></div>
                <p className="text-xl font-black text-emerald-700">{formatCurrency(extractInfo(selectedOrder).amount)}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-4">
                {extractInfo(selectedOrder).status === 'pending' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex justify-center gap-2"><CheckCircle2 className="w-5 h-5"/> Préparer</button>
                )}
                {extractInfo(selectedOrder).status === 'processing' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 flex justify-center gap-2"><Truck className="w-5 h-5"/> Livrer</button>
                )}
                <button onClick={() => window.print()} className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl flex justify-center gap-2"><Printer className="w-5 h-5"/> Imprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}