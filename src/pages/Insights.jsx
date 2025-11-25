import { useMemo } from "react"
import { monthInsights } from "../lib/storage.js"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts"
import { useTranslation } from "react-i18next"

export default function Insights(){
  const { t } = useTranslation()
  const { byCategory, expenses, sum } = useMemo(() => monthInsights(), [])

  const data = Object.entries(byCategory).map(([name, value]) => ({ name, value }))
  const daily = expenses.reduce((acc, e) => {
    const day = new Date(e.date).toISOString().slice(0,10)
    acc[day] = (acc[day] || 0) + (Number(e.amount) || 0)
    return acc
  }, {})
  const series = Object.entries(daily).sort().map(([date, value]) => ({ date, value }))

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        <section className="card col-12">
          <h2>{t("insights.title")}</h2>
          <p className="muted">
            {t("insights.totalSpent")} <b>${sum.toFixed(2)}</b>
          </p>
        </section>

        <section className="card col-6">
          <h3>{t("insights.spendByCategoryTitle")}</h3>
          {data.length === 0 ? (
            <p className="muted">{t("insights.noData")}</p>
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
          <h3>{t("insights.dailySpendTitle")}</h3>
          {series.length === 0 ? (
            <p className="muted">{t("insights.noData")}</p>
          ) : (
            <div className="chart">
              <ResponsiveContainer>
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name={t("insights.chart.amount")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
