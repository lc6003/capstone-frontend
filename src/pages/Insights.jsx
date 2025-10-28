import { useMemo } from 'react'
import { monthInsights } from '../lib/storage.js'
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function Insights(){
  const { byCategory, expenses, sum } = useMemo(()=> monthInsights(), [])

  const data = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  const daily = expenses.reduce((acc, e)=>{
    const day = new Date(e.date).toISOString().slice(0,10)
    acc[day] = (acc[day]||0) + (Number(e.amount)||0)
    return acc
  }, {})
  const series = Object.entries(daily).sort().map(([date, value]) => ({ date, value }))

  return (
    <div className="grid">
      <section className="card" style={{gridColumn:'span 12'}}>
        <h2>Insights (This Month)</h2>
        <p className="muted">Total spent so far: <b>${sum.toFixed(2)}</b></p>
      </section>

      <section className="card" style={{gridColumn:'span 6', height:380}}>
        <h3>Spend by Category</h3>
        {data.length===0? <p className="muted">No data yet.</p> : (
          <div style={{width:'100%', height:300}}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card" style={{gridColumn:'span 6', height:380}}>
        <h3>Daily Spend</h3>
        {series.length===0? <p className="muted">No data yet.</p> : (
          <div style={{width:'100%', height:300}}>
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
