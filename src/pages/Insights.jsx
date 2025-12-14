import { useState, useEffect } from "react"
import { fetchExpenses } from "../lib/api.js"
import { PieChart, Pie, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

export default function Insights(){
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    try {
      const data = await fetchExpenses()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    }
  }

  const now = new Date()
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const byCategory = thisMonthExpenses.reduce((acc, e) => {
    const cat = e.category || "Uncategorized"
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0)
    return acc
  }, {})

  const sum = thisMonthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  const data = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  const daily = thisMonthExpenses.reduce((acc, e) => {
    const day = new Date(e.date).toISOString().slice(0,10)
    acc[day] = (acc[day] || 0) + (Number(e.amount) || 0)
    return acc
  }, {})
  const series = Object.entries(daily).sort().map(([date, value]) => ({ date, value }))

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>Insights (This Month)</h2>
          <p className="muted">Total spent so far: <b>${sum.toFixed(2)}</b></p>
        </section>

        <section className="card col-6">
          <h3>Spend by Category</h3>
          {data.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="chart">
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

        <section className="card col-6">
          <h3>Daily Spend</h3>
          {series.length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="chart">
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
    </div>
  )
}