export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Mon Dashboard
        </h1>
        {/* Votre contenu personnalisé ici */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <h2 className="text-2xl font-semibold text-gray-900">Bienvenue</h2>
            <p>Contenu personnalisé</p>
          </div>
        </div>
      </div>
    </div>
  );
}
