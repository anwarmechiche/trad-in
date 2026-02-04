'use client'

import { useState, useEffect } from 'react'
import * as SupabaseLib from '@/lib/supabase' 
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function MerchantSettingsTab({ merchantId }: { merchantId: any }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = SupabaseLib.supabase || (SupabaseLib as any).default;

  const getSafeUUID = (id: any) => {
    if (!id) return null;
    const strId = String(id).trim();
    if (strId.length >= 32 && strId.includes('-')) return strId;
    const numericId = strId.replace(/\D/g, ''); 
    const finalNumeric = numericId || "1";
    return `00000000-0000-0000-0000-${finalNumeric.padStart(12, '0')}`;
  };

  const finalId = getSafeUUID(merchantId);

  const [settings, setSettings] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_city: '',
    company_logo: '', 
    nif: '', 
    ai: '',  
    rc: '',  
    currency: 'DZD',
    invoice_prefix: 'FAC',
    notes: ''
  })

  useEffect(() => {
    if (supabase && finalId) loadSettings();
    else setLoading(false);
  }, [finalId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_settings')
        .select('*')
        .eq('merchant_id', finalId)
        .maybeSingle()
      
      if (data) {
        // CORRECTION ICI : On force chaque valeur null à devenir une chaîne vide ''
        setSettings({
          company_name: data.company_name || '',
          company_email: data.company_email || '',
          company_phone: data.company_phone || '',
          company_address: data.company_address || '',
          company_city: data.company_city || '',
          company_logo: data.company_logo || '',
          nif: data.nif || '',
          ai: data.ai || '',
          rc: data.rc || '',
          currency: data.currency || 'DZD',
          invoice_prefix: data.invoice_prefix || 'FAC',
          notes: data.notes || ''
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('merchant_settings')
        .upsert({
          merchant_id: finalId,
          ...settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'merchant_id' })
      if (error) throw error;
      alert('✅ Sauvegardé !');
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = "w-full p-2 border border-gray-300 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none text-sm";
  const labelStyle = "block text-[10px] font-bold text-gray-500 uppercase";

  if (loading) return <div className="p-10 text-center text-black font-bold">Chargement...</div>

  return (
    <Card className="p-6 max-w-4xl mx-auto bg-white shadow-lg border border-gray-200">
      <div className="flex items-center gap-4 mb-6 border-b pb-4">
        <div className="w-16 h-16 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
          {settings.company_logo ? <img src={settings.company_logo} alt="Logo" className="object-contain" /> : <span className="text-[10px] text-gray-400">LOGO</span>}
        </div>
        <h2 className="text-xl font-bold text-black uppercase tracking-tight">Paramètres du Marchand</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-blue-600 font-bold text-[10px] border-b pb-1 uppercase">Coordonnées</p>
          <div>
            <label className={labelStyle}>Raison Sociale</label>
            <input className={inputStyle} value={settings.company_name} onChange={(e) => setSettings({...settings, company_name: e.target.value})} />
          </div>
          <div>
            <label className={labelStyle}>Email</label>
            <input className={inputStyle} type="email" value={settings.company_email} onChange={(e) => setSettings({...settings, company_email: e.target.value})} />
          </div>
          <div>
            <label className={labelStyle}>Téléphone</label>
            <input className={inputStyle} value={settings.company_phone} onChange={(e) => setSettings({...settings, company_phone: e.target.value})} />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-red-600 font-bold text-[10px] border-b pb-1 uppercase">Fisc & Factures</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className={labelStyle}>NIF</label>
              <input className={inputStyle} value={settings.nif} onChange={(e) => setSettings({...settings, nif: e.target.value})} />
            </div>
            <div>
              <label className={labelStyle}>AI</label>
              <input className={inputStyle} value={settings.ai} onChange={(e) => setSettings({...settings, ai: e.target.value})} />
            </div>
            <div>
              <label className={labelStyle}>RC</label>
              <input className={inputStyle} value={settings.rc} onChange={(e) => setSettings({...settings, rc: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      <Button 
        className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-lg transition-all"
        onClick={handleSave} 
        disabled={saving}
      >
        {saving ? 'Enregistrement...' : 'ENREGISTRER LES MODIFICATIONS'}
      </Button>
    </Card>
  )
}