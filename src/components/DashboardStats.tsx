/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shipment } from '../types';
import { 
  TrendingUp, 
  Package, 
  FileText, 
  AlertCircle, 
  DollarSign, 
  CheckCircle, 
  Truck, 
  Clock 
} from 'lucide-react';

interface DashboardStatsProps {
  shipments: Shipment[];
}

export default function DashboardStats({ shipments }: DashboardStatsProps) {
  const activeCount = shipments.filter(s => s.currentStatus !== 'delivered').length;
  const deliveredCount = shipments.filter(s => s.currentStatus === 'delivered').length;
  const pendingPaymentCount = shipments.filter(s => s.currentStatus === 'payment_pending').length;
  const inspectionCount = shipments.filter(s => s.currentStatus === 'inspection' || s.currentStatus === 'lab_testing').length;

  // حساب إجمالي الرسوم الجمركية المدفوعة (للشحنات المستلمة أو المدفوع رسومها)
  const totalDutiesUSD = shipments.reduce((acc, s) => {
    if (s.dutiesPaid || s.currentStatus === 'delivered') {
      const decDoc = s.documents.find(d => d.type === 'declaration');
      const duties = decDoc?.content.dutiesAmount || 0;
      const vat = decDoc?.content.vatAmount || 0;
      const port = decDoc?.content.portFees || 0;
      return acc + (duties + vat + port) / 3.75; // تحويل تقريبي للدولار
    }
    return acc;
  }, 0);

  const totalValueUSD = shipments.reduce((acc, s) => acc + s.valueUSD, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* كرت شحنات نشطة */}
      <div id="stat_active_shipments" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium block mb-1">الشحنات النشطة قيد الإجراء</span>
          <h3 className="text-2xl font-bold text-gray-800 font-sans">{activeCount} <span className="text-sm font-normal text-gray-400">حاويات</span></h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <TrendingUp size={12} />
            <span>تتبع فوري ومراقبة جغرافية</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Package size={22} />
        </div>
      </div>

      {/* كرت بانتظار السداد */}
      <div id="stat_pending_payments" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium block mb-1">معاملات بانتظار سداد الرسوم</span>
          <h3 className="text-2xl font-bold text-gray-800 font-sans">{pendingPaymentCount} <span className="text-sm font-normal text-gray-400">فواتير</span></h3>
          <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs">
            <Clock size={12} />
            <span>تجنب رسوم الأرضيات والانتظار</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <DollarSign size={22} />
        </div>
      </div>

      {/* كرت المعاينة والتحليل */}
      <div id="stat_inspections" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium block mb-1">قيد الفحص المخبري والمعاينة</span>
          <h3 className="text-2xl font-bold text-gray-800 font-sans">{inspectionCount} <span className="text-sm font-normal text-gray-400">شحنات</span></h3>
          <div className="flex items-center gap-1 mt-2 text-rose-500 text-xs">
            <AlertCircle size={12} />
            <span>هيئة المواصفات وضبط الجودة</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
          <FileText size={22} />
        </div>
      </div>

      {/* كرت الشحنات المستلمة */}
      <div id="stat_completed_shipments" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 font-medium block mb-1">الشحنات المفرغة بالمخازن</span>
          <h3 className="text-2xl font-bold text-gray-800 font-sans">{deliveredCount} <span className="text-sm font-normal text-gray-400">مكتملة</span></h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
            <CheckCircle size={12} />
            <span>إجمالي جمرك: ${(totalDutiesUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Truck size={22} />
        </div>
      </div>
    </div>
  );
}
