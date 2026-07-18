/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Shipment } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  Area
} from 'recharts';
import { 
  BarChart3, 
  DollarSign, 
  TrendingDown, 
  Sliders, 
  HelpCircle,
  PiggyBank,
  AlertTriangle,
  Info
} from 'lucide-react';

interface CostAnalysisChartProps {
  shipments: Shipment[];
}

export default function CostAnalysisChart({ shipments }: CostAnalysisChartProps) {
  // تصفية عدد الشحنات المراد مقارنتها (آخر 5، آخر 10، الكل)
  const [limit, setLimit] = useState<number>(5);
  // ميزانية الرسوم المستهدفة كنقاط مئوية من قيمة البضاعة لتوضيح الفروقات
  const [budgetPercent, setBudgetPercent] = useState<number>(15);

  // إعداد بيانات التكاليف لكل شحنة
  const chartData = useMemo(() => {
    // نأخذ عينة من الشحنات
    const filtered = [...shipments]
      .filter(s => s.valueUSD > 0)
      .slice(0, limit);

    return filtered.map(s => {
      // 1. حساب الرسوم الجمركية الفعلية أو التقديرية بناءً على الملفات المرفقة
      const decDoc = s.documents.find(d => d.type === 'declaration');
      
      const customDuties = decDoc?.content.dutiesAmount 
        ? decDoc.content.dutiesAmount / 3.75 // تحويل تقريبي للدولار
        : (s.valueUSD * (s.dutyRate || 10)) / 100;

      const vat = decDoc?.content.vatAmount
        ? decDoc.content.vatAmount / 3.75
        : (s.valueUSD * 5) / 100;

      const portFees = decDoc?.content.portFees
        ? decDoc.content.portFees / 3.75
        : 450; // رسوم أرضيات ومناولة افتراضية

      // مصاريف النقل البري والتأمين والتأمين الجمركي
      const logisticsAndTransport = s.weight * 20 + 150; // 20 دولار للطن + 150 ثابت

      const totalActualExpenses = customDuties + vat + portFees + logisticsAndTransport;
      
      // ميزانية الرسوم والضرائب الإجمالية المحددة مسبقاً (المدخلة أو المحسوبة مئوياً)
      const allocatedBudget = (s.valueUSD * budgetPercent) / 100;

      // الفرق بين الميزانية والواقع (عجز أو وفر)
      const variance = allocatedBudget - totalActualExpenses;

      return {
        id: s.id,
        code: s.code,
        title: s.title,
        cargoValue: s.valueUSD,
        'الرسوم الجمركية': Math.round(customDuties),
        'ضريبة القيمة المضافة': Math.round(vat),
        'أجور الميناء والخدمات': Math.round(portFees),
        'المصاريف اللوجستية': Math.round(logisticsAndTransport),
        'إجمالي التكلفة الفعلية': Math.round(totalActualExpenses),
        'الميزانية المحددة': Math.round(allocatedBudget),
        variance: Math.round(variance),
        isOverBudget: totalActualExpenses > allocatedBudget
      };
    });
  }, [shipments, limit, budgetPercent]);

  // إحصائيات المجموعات العامة للتكاليف
  const summary = useMemo(() => {
    const totalActual = chartData.reduce((sum, item) => sum + item['إجمالي التكلفة الفعلية'], 0);
    const totalBudget = chartData.reduce((sum, item) => sum + item['الميزانية المحددة'], 0);
    const overBudgetCases = chartData.filter(item => item.isOverBudget).length;
    
    return {
      totalActual,
      totalBudget,
      overBudgetCases,
      totalSavings: totalBudget - totalActual
    };
  }, [chartData]);

  // تنسيق التول تيب العربي المخصص للرسم البياني
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl shadow-xl font-sans text-right text-xs space-y-2 max-w-[280px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex justify-between gap-4">
            <span className="font-mono text-emerald-400">{data.code}</span>
            <span className="truncate">{data.title}</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between gap-6">
              <span className="font-mono font-bold text-white">${data['إجمالي التكلفة الفعلية'].toLocaleString()}</span>
              <span>التكلفة الفعلية:</span>
            </div>
            <div className="flex justify-between gap-6 text-[10px] pl-2 text-slate-400">
              <span className="font-mono">${data['الرسوم الجمركية'].toLocaleString()}</span>
              <span>الرسوم الجمركية:</span>
            </div>
            <div className="flex justify-between gap-6 text-[10px] pl-2 text-slate-400">
              <span className="font-mono">${data['ضريبة القيمة المضافة'].toLocaleString()}</span>
              <span>ضريبة القيمة المضافة:</span>
            </div>
            <div className="flex justify-between gap-6 text-[10px] pl-2 text-slate-400">
              <span className="font-mono">${data['أجور الميناء والخدمات'].toLocaleString()}</span>
              <span>الموانئ والأرضيات:</span>
            </div>
            <div className="flex justify-between gap-6 text-[10px] pl-2 text-slate-400">
              <span className="font-mono">${data['المصاريف اللوجستية'].toLocaleString()}</span>
              <span>الخدمات والنقل البري:</span>
            </div>
            <hr className="border-slate-800 my-1" />
            <div className="flex justify-between gap-6">
              <span className="font-mono font-bold text-indigo-400">${data['الميزانية المحددة'].toLocaleString()}</span>
              <span>الميزانية المرصودة:</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-slate-800 pt-1.5 mt-1 font-bold">
              {data.variance >= 0 ? (
                <span className="text-emerald-400 font-mono">وفر: +${Math.abs(data.variance).toLocaleString()}</span>
              ) : (
                <span className="text-rose-400 font-mono">عجز: -${Math.abs(data.variance).toLocaleString()}</span>
              )}
              <span>فارق الميزانية:</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="cost_analysis_container" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-right font-sans">
      
      {/* الرأس لوجهة التحكم المتقدمة للمصاريف */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        
        {/* فلاتر التحكم والتخصيص */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* سلايدر الميزانية */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <Sliders size={12} className="text-slate-400" />
            <span className="text-[10px] text-gray-500 font-bold">الميزانية المقررة:</span>
            <input 
              type="range" 
              min={5} 
              max={30} 
              value={budgetPercent} 
              onChange={(e) => setBudgetPercent(parseInt(e.target.value))}
              className="w-16 sm:w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="text-[10px] font-mono font-bold text-emerald-700">{budgetPercent}%</span>
          </div>

          {/* تحديد عدد المعاملات المشمولة بالرسم */}
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="text-[10px] font-bold px-2.5 py-1.5 bg-gray-55 border border-gray-200 rounded-xl text-gray-600 outline-none focus:border-emerald-500"
          >
            <option value={5}>آخر 5 معاملات</option>
            <option value={10}>آخر 10 معاملات</option>
            <option value={20}>جميع المعاملات</option>
          </select>
        </div>

        {/* عنوان المكون */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-800">تحليل وتوزيع تكاليف التخليص الجمركي والخدمات اللوجستية</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">مقارنة دورية لكافة مصروفات الشحنات الموحدة ضد الميزانيات المعتمدة بالتناسب</p>
          </div>
        </div>

      </div>

      {/* خلاصة وبطاقات سريعة للمصاريف */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 block font-bold mb-0.5">إجمالي الميزانية المرصودة</span>
            <span className="text-base font-extrabold text-indigo-700 font-mono" style={{ direction: 'ltr' }}>
              $ {summary.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <PiggyBank size={18} />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 block font-bold mb-0.5">إجمالي المصروفات الفعلية</span>
            <span className="text-base font-extrabold text-slate-800 font-mono" style={{ direction: 'ltr' }}>
              $ {summary.totalActual.toLocaleString()}
            </span>
          </div>
          <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-gray-100/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 block font-bold mb-0.5">الانحراف وفارق الميزانية الكلي</span>
            {summary.totalSavings >= 0 ? (
              <span className="text-base font-extrabold text-emerald-600 font-mono" style={{ direction: 'ltr' }}>
                وفر: +$ {Math.abs(summary.totalSavings).toLocaleString()}
              </span>
            ) : (
              <span className="text-base font-extrabold text-rose-550 font-mono" style={{ direction: 'ltr' }}>
                تجاوز: -$ {Math.abs(summary.totalSavings).toLocaleString()}
              </span>
            )}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${summary.totalSavings >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {summary.totalSavings >= 0 ? <TrendingDown size={18} /> : <AlertTriangle size={18} />}
          </div>
        </div>
      </div>

      {/* الرسم البياني الممتع والاحترافي التراكمي المكدس */}
      <div className="h-[300px] w-full font-mono mt-2" style={{ direction: 'ltr' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 10, bottom: 5, left: -10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
              dataKey="code" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight="bold"
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight="bold"
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', fontFamily: 'sans-serif', fontWeight: 'bold', paddingTop: '10px' }}
            />
            
            {/* أجزاء المصروفات المكدسة لتوضيح توزيع التكلفة الفعلي */}
            <Bar dataKey="الرسوم الجمركية" stackId="actual" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="ضريبة القيمة المضافة" stackId="actual" fill="#6366f1" radius={[0, 0, 0, 0]} />
            <Bar dataKey="أجور الميناء والخدمات" stackId="actual" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="المصاريف اللوجستية" stackId="actual" fill="#10b981" radius={[4, 4, 0, 0]} />

            {/* خط الميزانية المحددة للمقارنة الحية */}
            <Line 
              name="ميزانية الشحنة المحددة" 
              type="monotone" 
              dataKey="الميزانية المحددة" 
              stroke="#4f46e5" 
              strokeWidth={2.5} 
              dot={{ r: 4, strokeWidth: 1.5, fill: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* تلميح جمركي أسفل الرسم */}
      <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100/60 rounded-xl flex items-start gap-2">
        <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[9.5px] text-indigo-700 leading-relaxed font-semibold">
          * يتم توزيع الميزانية المحددة تلقائياً كنسبة تناسبية من القيمة الإجمالية للمشتريات لكل حاوية. تشتمل التكاليف اللوجستية على أجور المناولة بميناء عدن والمنشأ والفسح والتفتيش الميداني وهيئة المواصفات والنقل البري بالترانزيت.
        </p>
      </div>

    </div>
  );
}
