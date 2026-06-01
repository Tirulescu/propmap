"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoadingLabel } from "@/app/components/loading-label";
import { useMounted } from "@/lib/hooks/use-mounted";
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
  const [month, setMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const mounted = useMounted();
  const currentYear = mounted ? new Date().getFullYear() : selectedYear;

  const availableYears = useMemo(() => {
    const years = new Set(projections.map((p) => p.year));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [projections, currentYear]);

  useEffect(() => {
    if (mounted) {
      setMonth(new Date().getMonth() + 1);
      setSelectedYear(new Date().getFullYear());
    }
  }, [mounted]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  async function addRow(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/properties/${propertyId}/projections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, amount: parseFloat(amount), year: selectedYear, month }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function toNumber(amt: string | number) {
    if (typeof amt === "number") return amt;
    return parseFloat(amt) || 0;
  }

  const yearProjections = projections.filter((p) => p.year === selectedYear);
  const income = yearProjections.filter((p) => p.type === "INCOME");
  const expense = yearProjections.filter((p) => p.type === "EXPENSE");

  const totalIncome = income.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const totalExpense = expense.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const balance = totalIncome - totalExpense;

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const monthLabelsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const chartData = monthLabelsShort.map((m, i) => ({
    month: m,
    ingresos: income
      .filter((p) => p.month === i + 1)
      .reduce((sum, p) => sum + toNumber(p.amount), 0),
    gastos: expense
      .filter((p) => p.month === i + 1)
      .reduce((sum, p) => sum + toNumber(p.amount), 0),
  }));

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="finance-year" className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium">
            Año
          </label>
          <select
            id="finance-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="min-w-[6rem]"
            suppressHydrationWarning
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center sm:text-left">
          <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1">Ingresos {selectedYear}</div>
          <div className="text-xl sm:text-2xl font-semibold text-moss font-display">
            €{totalIncome.toFixed(2)}
          </div>
        </div>
        <div className="card p-4 text-center sm:text-left">
          <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1">Gastos {selectedYear}</div>
          <div className="text-xl sm:text-2xl font-semibold text-[#B54A35] font-display">
            €{totalExpense.toFixed(2)}
          </div>
        </div>
        <div className={`card p-4 text-center sm:text-left ${balance >= 0 ? "border-[#4A6E47]/30" : "border-[#B54A35]/30"}`}>
          <div className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1">Balance {selectedYear}</div>
          <div className={`text-xl sm:text-2xl font-semibold font-display ${balance >= 0 ? "text-[#4A6E47]" : "text-[#B54A35]"}`}>
            €{balance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Gráfica */}
      {mounted && (
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold text-[#1A1510]">Resumen {selectedYear}</h3>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC4" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B5E4E" }} axisLine={{ stroke: "#E8DCC4" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6B5E4E" }} axisLine={{ stroke: "#E8DCC4" }} />
              <Tooltip
                contentStyle={{
                  background: "#F7F4EF",
                  border: "1px solid #E8DCC4",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "13px", fontFamily: "var(--font-body)" }} />
              <Bar dataKey="ingresos" fill="#4A6E47" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#B54A35" name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Añadir */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">➕</span>
          <h3 className="font-semibold text-[#1A1510]">Añadir proyección</h3>
        </div>
        <form onSubmit={addRow} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="INCOME">💰 Ingreso</option>
              <option value="EXPENSE">💸 Gasto</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">Concepto</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="Ej: Tala, IBI..." />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">Importe (€)</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-[#9E8F7B] font-medium mb-1.5 block">Mes ({selectedYear})</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              suppressHydrationWarning
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-5">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto rounded-lg bg-[#4A6E47] px-5 py-2.5 text-sm text-white hover:bg-[#3a5a37] transition-colors font-medium disabled:opacity-60"
            >
              <LoadingLabel loading={saving} loadingText="Guardando…">
                Añadir
              </LoadingLabel>
            </button>
          </div>
        </form>
      </div>

      {/* Tabla - scroll horizontal en móvil */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-[#E8DCC4]/40">
                <th className="px-3 py-2.5 text-left font-medium text-[#6B5E4E]">Concepto</th>
                <th className="px-3 py-2.5 text-left font-medium text-[#6B5E4E]">Tipo</th>
                <th className="px-3 py-2.5 text-left font-medium text-[#6B5E4E]">Periodo</th>
                <th className="px-3 py-2.5 text-right font-medium text-[#6B5E4E]">Importe</th>
              </tr>
            </thead>
            <tbody>
              {yearProjections.map((p) => (
                <tr
                  key={p.id}
                  className={"border-t border-[#E8DCC4]/60 " + (p.type === "INCOME" ? "text-[#4A6E47]" : "text-[#B54A35]")}
                >
                  <td className="px-3 py-2.5">{p.category}</td>
                  <td className="px-3 py-2.5">
                    <span className={`badge ${p.type === "INCOME" ? "bg-[#4A6E47]/10 text-[#4A6E47]" : "bg-[#B54A35]/10 text-[#B54A35]"}`}>
                      {p.type === "INCOME" ? "💰 Ingreso" : "💸 Gasto"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {monthNames[(p.month ?? 1) - 1] || p.month} {p.year}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium">
                    €{toNumber(p.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {yearProjections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[#9E8F7B]">
                    Sin proyecciones en {selectedYear}. Añade tu primera entrada arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
