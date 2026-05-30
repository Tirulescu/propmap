"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Projection {
  id: string;
  year: number;
  month?: number;
  type: string;
  category: string;
  amount: string;
  description?: string;
}

export default function PropertyFinance({
  propertyId,
  projections,
}: {
  propertyId: string;
  projections: Projection[];
}) {
  const [type, setType] = useState("INCOME");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [year] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  async function addRow(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/properties/${propertyId}/projections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, category, amount: parseFloat(amount), year, month }),
    });
    window.location.reload();
  }

  function toNumber(amt: string | number) {
    if (typeof amt === "number") return amt;
    return parseFloat(amt) || 0;
  }

  const income = projections.filter((p) => p.type === "INCOME");
  const expense = projections.filter((p) => p.type === "EXPENSE");

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const chartData = months.map((m, i) => ({
    month: m,
    ingresos: income
      .filter((p) => p.month === i + 1)
      .reduce((sum, p) => sum + toNumber(p.amount), 0),
    gastos: expense
      .filter((p) => p.month === i + 1)
      .reduce((sum, p) => sum + toNumber(p.amount), 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded border p-4">
        <h3 className="font-semibold mb-4">Resumen {year}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
            <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-4 text-sm">
          <div>
            Ingresos totales: &euro;
            {income
              .reduce((sum, p) => sum + toNumber(p.amount), 0)
              .toFixed(2)}
          </div>
          <div>
            Gastos totales: &euro;
            {expense
              .reduce((sum, p) => sum + toNumber(p.amount), 0)
              .toFixed(2)}
          </div>
          <div className="font-semibold">
            Balance: &euro;
            {(
              income.reduce((sum, p) => sum + toNumber(p.amount), 0) -
              expense.reduce((sum, p) => sum + toNumber(p.amount), 0)
            ).toFixed(2)}
          </div>
        </div>
      </div>

      <h3 className="font-semibold mt-2">A&ntilde;adir proyecci&oacute;n</h3>
      <form onSubmit={addRow} className="grid grid-cols-5 gap-2 items-end">
        <div>
          <label className="text-xs">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded w-full px-2 py-1"
          >
            <option value="INCOME">Ingreso</option>
            <option value="EXPENSE">Gasto</option>
          </select>
        </div>
        <div>
          <label className="text-xs">Concepto</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="border rounded w-full px-2 py-1"
          />
        </div>
        <div>
          <label className="text-xs">Importe (&euro;)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="border rounded w-full px-2 py-1"
          />
        </div>
        <div>
          <label className="text-xs">Mes</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border rounded w-full px-2 py-1"
          />
        </div>
        <button type="submit" className="rounded bg-[#4A6E47] px-3 py-1 text-white">
          A&ntilde;adir
        </button>
      </form>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#E8DCC4]/30">
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Mes</th>
              <th className="px-3 py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p) => (
              <tr
                key={p.id}
                className={
                  "border-t " +
                  (p.type === "INCOME" ? "text-green-700" : "text-red-700")
                }
              >
                <td className="px-3 py-2">{p.category}</td>
                <td className="px-3 py-2">
                  {p.type === "INCOME" ? "Ingreso" : "Gasto"}
                </td>
                <td className="px-3 py-2">{p.month}</td>
                <td className="px-3 py-2 text-right">
                  &euro;{toNumber(p.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
