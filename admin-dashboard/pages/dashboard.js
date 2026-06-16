import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#F59E0B', '#10B981', '#EF4444', '#6366F1'];

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(r => {
      setStats(r.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Layout title="Dashboard"><p className="text-gray-400">Chargement...</p></Layout>;

  const pieData = [
    { name: 'En attente', value: stats.en_attente },
    { name: 'Approuvés',  value: stats.approuve },
    { name: 'Rejetés',    value: stats.rejete },
  ];

  return (
    <Layout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total dossiers',  value: stats.total,      color: 'bg-amber-500' },
          { label: 'En attente',      value: stats.en_attente, color: 'bg-orange-400' },
          { label: 'Approuvés',       value: stats.approuve,   color: 'bg-green-500' },
          { label: 'Rejetés',         value: stats.rejete,     color: 'bg-red-500' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 ${kpi.color} rounded-lg mb-3`}/>
            <p className="text-3xl font-bold text-gray-800">{kpi.value}</p>
            <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Dossiers par agence */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Dossiers par agence</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.par_agence} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="nom" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Bar dataKey="approuve"   name="Approuvés"  fill="#10B981" stackId="a"/>
              <Bar dataKey="en_attente" name="En attente" fill="#F59E0B" stackId="a"/>
              <Bar dataKey="rejete"     name="Rejetés"    fill="#EF4444" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition statuts */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Répartition des statuts</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100}
                   dataKey="value" label={({ name, percent }) =>
                     `${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Évolution mensuelle */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-4">Évolution sur 6 mois</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.par_mois}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="mois" tick={{ fontSize: 12 }}/>
            <YAxis tick={{ fontSize: 12 }}/>
            <Tooltip/>
            <Line type="monotone" dataKey="total" stroke="#F59E0B"
                  strokeWidth={2} dot={{ r: 4 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  );
}