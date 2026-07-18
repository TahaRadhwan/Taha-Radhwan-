/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Shipment, CargoType, CustomsStatus } from '../types';
import { HS_CODES, PORTS, CARRIERS, SUPPLIERS, generateContainerNumber, createDefaultDocuments } from '../data';
import { 
  Plus, 
  Search, 
  Filter, 
  Anchor, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Sparkles,
  X,
  FileCheck2,
  PackageCheck,
  Building2,
  Printer
} from 'lucide-react';
import OfficialCustomsReportModal from './OfficialCustomsReportModal';

interface ShipmentListProps {
  shipments: Shipment[];
  onSelectShipment: (shipment: Shipment) => void;
  onAddShipment: (newShipment: Shipment) => void;
}

export default function ShipmentList({ shipments, onSelectShipment, onAddShipment }: ShipmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // فورم إضافة شحنة جديدة
  const [title, setTitle] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>('electronics');
  const [selectedSupplierIdx, setSelectedSupplierIdx] = useState(0);
  const [portId, setPortId] = useState(PORTS[0].id);
  const [carrierId, setCarrierId] = useState(CARRIERS[0].id);
  const [weight, setWeight] = useState(10);
  const [valueUSD, setValueUSD] = useState(50000);
  const [clientName, setClientName] = useState('');
  const [direction, setDirection] = useState<'import' | 'export'>('import');

  const getStatusBadge = (status: CustomsStatus) => {
    switch (status) {
      case 'purchased':
        return <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full font-bold">1. شراء البضاعة</span>;
      case 'docs_ready':
        return <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">2. الوثائق جاهزة</span>;
      case 'arrived_at_port':
        return <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold">3. بالمنفذ / الميناء</span>;
      case 'declaration_submitted':
        return <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">4. تقديم البيان الجمركي</span>;
      case 'inspection':
        return <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold">5. معاينة وتفتيش</span>;
      case 'lab_testing':
        return <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-bold">6. فحص المقاييس</span>;
      case 'payment_pending':
        return <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full font-bold animate-pulse">7. بانتظار الرسوم</span>;
      case 'released':
        return <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-bold">8. الفسح الجمركي</span>;
      case 'in_transit':
        return <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">9. قيد الترانزيت البري</span>;
      case 'delivered':
        return <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">10. بالمخازن مكتملة</span>;
      default:
        return null;
    }
  };

  const getCargoTypeLabel = (type: CargoType) => {
    switch (type) {
      case 'electronics': return '📱 إلكترونيات وأجهزة تكنولوجية';
      case 'food': return '🍎 مواد غذائية وحجر صحي';
      case 'clothes': return '👕 ملابس جاهزة ومنسوجات';
      case 'industrial': return '⚙️ خطوط إنتاج ومعدات صناعية';
      case 'cars': return '🚗 سيارات ومركبات ركوب';
      case 'medical': return '💊 أدوية ومستلزمات طبية';
      case 'chemicals': return '🧪 مواد كيميائية وبلاستيكية';
      case 'building': return '🧱 مواد بناء وحديد وأخشاب';
      case 'agriculture': return '🌱 بذور ومعدات زراعية وطاقة';
    }
  };

  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = ship.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ship.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ship.containerNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCargo = filterCargo === 'all' || ship.cargoType === filterCargo;
    const matchesStatus = filterStatus === 'all' || ship.currentStatus === filterStatus;
    return matchesSearch && matchesCargo && matchesStatus;
  });

  const handleSubmitNewShipment = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("الرجاء إدخال اسم أو تفاصيل واضحة للشحنة.");
      return;
    }

    const shipCode = `YE-${Math.floor(10000 + Math.random() * 90000)}`;
    const containerNum = generateContainerNumber();
    const carrier = CARRIERS.find(c => c.id === carrierId)?.name || 'الناقل البحري العالمي';
    const port = PORTS.find(p => p.id === portId)?.nameAr || 'الميناء المعتمد';
    
    const supplierList = SUPPLIERS[cargoType];
    const supplier = supplierList[selectedSupplierIdx] || supplierList[0];
    const trackingNum = `TRK-YE-${Math.floor(10000 + Math.random() * 90000)}`;

    const newShipment: Shipment = {
      id: `ship_${Date.now()}`,
      code: shipCode,
      trackingNumber: trackingNum,
      title: title,
      cargoType: cargoType,
      supplier: direction === 'export' ? 'مؤسسة طه رضوان اللوجستية (مصدّر)' : supplier.name,
      countryOfOrigin: direction === 'export' ? 'اليمن' : supplier.country,
      portOfDischarge: port,
      containerNumber: containerNum,
      weight: Number(weight),
      valueUSD: Number(valueUSD),
      valueLocal: Math.round(Number(valueUSD) * 1350), // تحويل افتراضي للريال اليمني
      carrierName: carrier,
      currentStatus: 'purchased',
      direction: direction,
      clientName: clientName || 'مجموعة طه رضوان للخدمات اللوجستية',
      estimatedArrival: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currentLocation: direction === 'export' ? 'مستودع التصدير المحيط بالجمهور - جاري تجميع البضاعة' : 'ميناء المغادرة الأصلي - بانتظار الشحن البحري لليمن',
      documents: [], // سيتم ملؤها بالدالة المعتمدة بالأسفل
      logs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'purchased',
          message: `تم تحرير معاملة شراء شحنة (${title}) بنجاح من المورد ${supplier.name} ببلد منشأ ${supplier.country} وميناء وصول هو ${port}.`,
          userAction: true
        }
      ],
      hsCode: HS_CODES[cargoType].code,
      dutyRate: HS_CODES[cargoType].dutyRate,
      inspectionChannel: Math.random() > 0.5 ? 'red' : 'yellow', // تعيين آلي للمسار جمركياً
      inspectionNotes: cargoType === 'food' 
        ? 'تحتاج لفحص حجر صحي شامل وتحليل مخبري لنسب السموم والمواد الحافظة.' 
        : cargoType === 'cars' 
          ? 'تفتيش كود الشاصية ومطابقة مواصفات الخليج القياسية لسلامة المركبات.' 
          : 'فحص عيني للتحقق من مطابقة الفاتورة والأوزان.',
      labResult: HS_CODES[cargoType].requiresSpecialInspection ? 'pending' : 'passed',
      dutiesPaid: false,
      transitProgress: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // توليد الوثائق
    newShipment.documents = createDefaultDocuments(
      cargoType,
      shipCode,
      Number(valueUSD),
      Number(weight),
      supplier.name,
      supplier.country,
      containerNum
    );

    onAddShipment(newShipment);
    setShowAddModal(false);
    
    // تصفير مدخلات الفوم
    setTitle('');
    setWeight(10);
    setValueUSD(50000);
  };

  return (
    <div className="space-y-4">
      {/* فلترة وبحث */}
      <div id="shipment_filter_bar" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="البحث برقم المعاملة، الحاوية أو الاسم..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* فلتر نوع السلعة */}
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 gap-1.5">
            <Filter size={12} />
            <select 
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4"
            >
              <option value="all">كل أنواع السلع</option>
              <option value="electronics">📱 الإلكترونيات</option>
              <option value="food">🍎 الأغذية</option>
              <option value="clothes">👕 الملابس</option>
              <option value="industrial">⚙️ الصناعية</option>
              <option value="cars">🚗 السيارات</option>
              <option value="medical">💊 الأدوية والمستلزمات الطبية</option>
              <option value="chemicals">🧪 المواد الكيميائية والبوليمرات</option>
              <option value="building">🧱 مواد البناء والحديد</option>
              <option value="agriculture">🌱 المنتجات والمعدات الزراعية</option>
            </select>
          </div>

          {/* فلتر خطوة التخليص */}
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 gap-1.5">
            <Anchor size={12} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-4"
            >
              <option value="all">كل الحالات الجمركية</option>
              <option value="purchased">1. الشراء والطلب</option>
              <option value="docs_ready">2. تجهيز الوثائق</option>
              <option value="arrived_at_port">3. وصول الميناء</option>
              <option value="declaration_submitted">4. تقديم البيان</option>
              <option value="inspection">5. المعاينة والتفتيش</option>
              <option value="lab_testing">6. فحص المقاييس</option>
              <option value="payment_pending">7. بانتظار الرسوم</option>
              <option value="released">8. الفسح الجمركي</option>
              <option value="in_transit">9. الترانزيت البري</option>
              <option value="delivered">10. بالمخازن مكتملة</option>
            </select>
          </div>

          <button 
            onClick={() => setShowReportModal(true)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="تصدير كشوفات الشحنات والبيانات الجمركية المجمعة لملف PDF جاهز للطباعة"
          >
            <Printer size={14} className="text-emerald-600" />
            <span>تصدير كشف PDF رسمي</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            <span>إنشاء معاملة جمركية جديدة</span>
          </button>
        </div>
      </div>

      {/* قائمة الشحنات الفعلية المبرمة */}
      <div id="shipment_records_list" className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100">
        <div className="p-4 bg-gray-50/50 rounded-t-2xl flex justify-between items-center text-xs font-bold text-gray-500">
          <span>سجلات الشحنات النشطة والمكتملة ({filteredShipments.length} شحنة)</span>
          <span className="text-[10px] text-gray-400">انقر على الشحنة لتشغيل مراحل التخليص</span>
        </div>

        {filteredShipments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
            <AlertCircle size={24} className="text-gray-300" />
            <span>لا توجد معاملات تطابق فلاتر البحث الحالية.</span>
          </div>
        ) : (
          filteredShipments.map((ship) => (
            <div 
              key={ship.id}
              onClick={() => onSelectShipment(ship)}
              className="p-5 hover:bg-emerald-50/10 cursor-pointer transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="flex gap-4 items-start">
                <span className="text-3xl p-3 bg-gray-50 rounded-2xl group-hover:bg-emerald-50 transition-all shrink-0">
                  {ship.cargoType === 'electronics' ? '📱' : ship.cargoType === 'food' ? '🍎' : ship.cargoType === 'clothes' ? '👕' : ship.cargoType === 'industrial' ? '⚙️' : '🚗'}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-extrabold text-gray-800 group-hover:text-emerald-700 transition-colors">
                      {ship.title}
                    </h4>
                    {getStatusBadge(ship.currentStatus)}
                  </div>
                  
                  <p className="text-[10px] text-gray-400 flex flex-wrap gap-x-2.5 gap-y-1">
                    <span>كود المعاملة: <strong className="font-mono text-gray-650">{ship.code}</strong></span>
                    <span>•</span>
                    <span>الحاوية: <strong className="font-mono text-gray-650">{ship.containerNumber}</strong></span>
                    <span>•</span>
                    <span>المورد: <strong className="text-gray-650">{ship.supplier} ({ship.countryOfOrigin})</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full md:w-auto md:gap-8 border-t border-gray-50 pt-3 md:border-0 md:pt-0">
                <div className="text-right space-y-1">
                  <span className="text-[10px] text-gray-400 block">إجمالي القيمة جمركياً</span>
                  <strong className="text-xs text-gray-700 font-mono block">
                    {(ship.valueLocal).toLocaleString()} ريال
                    <span className="text-[9px] text-gray-400 font-normal block mt-0.5">(${ship.valueUSD.toLocaleString()} USD)</span>
                  </strong>
                </div>

                <div className="flex items-center gap-1 text-gray-300 group-hover:text-emerald-600 transition-colors">
                  <ChevronRight size={18} className="rotate-180" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* مودال حواري منبثق لإضافة شحنة جديدة ومحاكاة دورة الشراء */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            {/* هيدر المودال */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="text-emerald-600" size={16} />
                <span>شراء بضاعة جديدة وإبرام معاملة استيراد</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* فورم الإضافة */}
            <form onSubmit={handleSubmitNewShipment} className="p-6 overflow-y-auto max-h-[75vh] space-y-4 text-right" dir="rtl">
              
              {/* اتجاه الحركة والتاجر المالك */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">اتجاه حركة الشحنة جمركياً:</label>
                  <select 
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as 'import' | 'export')}
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none cursor-pointer text-right"
                  >
                    <option value="import">📥 واردات (استيراد إلى اليمن)</option>
                    <option value="export">📤 صادرات (تصدير من اليمن للخارج)</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">اسم التاجر أو العميل المستورد:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: مجموعة هائل سعيد، مكتب سبأ للتجارة..."
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none bg-gray-50/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 block">تفاصيل أو مسمى الشحنة كتاجر:</label>
                <input 
                  type="text" 
                  placeholder="مثال: حاوية مستلزمات حواسيب ذكية، شحنة ملابس صيفية..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-all bg-gray-50/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">تصنيف ونوع السلعة (جمركياً):</label>
                  <select 
                    value={cargoType}
                    onChange={(e) => {
                      const newType = e.target.value as CargoType;
                      setCargoType(newType);
                      setSelectedSupplierIdx(0);
                    }}
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="electronics">📱 إلكترونيات (رسم جمركي 5%)</option>
                    <option value="food">🍎 مواد غذائية (رسم جمركي 10% + حجر)</option>
                    <option value="clothes">👕 ملابس جاهزة (رسم جمركي 15%)</option>
                    <option value="industrial">⚙️ معدات صناعية (رسم جمركي 2%)</option>
                    <option value="cars">🚗 سيارات ركوب (رسم جمركي 20%)</option>
                    <option value="medical">💊 أدوية ومستلزمات طبية (رسم جمركي 0% - معفى)</option>
                    <option value="chemicals">🧪 كيميائيات وبلاستيك (رسم جمركي 5% + موافقة)</option>
                    <option value="building">🧱 حديد ومواد بناء (رسم جمركي 10%)</option>
                    <option value="agriculture">🌱 معدات وأسمدة زراعية (رسم جمركي 1%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">المورد الأجنبي المتاح للتعاقد:</label>
                  <select 
                    value={selectedSupplierIdx}
                    onChange={(e) => setSelectedSupplierIdx(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    {SUPPLIERS[cargoType].map((sup, idx) => (
                      <option key={idx} value={idx}>
                        {sup.name} ({sup.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">منفذ وميناء التخليص النهائي:</label>
                  <select 
                    value={portId}
                    onChange={(e) => setPortId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    {PORTS.map((port) => (
                      <option key={port.id} value={port.id}>
                        {port.nameAr} ({port.cityAr})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">الشركة الملاحية للشحن البحري:</label>
                  <select 
                    value={carrierId}
                    onChange={(e) => setCarrierId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    {CARRIERS.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">قيمة فاتورة الشراء بالدولار ($ USD):</label>
                  <input 
                    type="number" 
                    value={valueUSD}
                    onChange={(e) => setValueUSD(Number(e.target.value))}
                    min={1000}
                    className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none bg-gray-50/50 font-mono text-left"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block pt-0.5 font-sans">سعر صرف تقديري (1 USD = 1,350 YER): {Math.round(valueUSD * 1350).toLocaleString()} ريال يمني</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">وزن الشحنة الصافي بالطن المتروي:</label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    min={0.1}
                    step={0.1}
                    className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none bg-gray-50/50 font-mono text-left"
                    required
                  />
                </div>
              </div>

              {/* بطاقة معاينة ذكية لتصنيف التعرفة */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs space-y-2">
                <h5 className="font-bold text-emerald-800 flex items-center gap-1">
                  <Sparkles size={14} />
                  <span>تصنيف ترميز جمركي تلقائي ذكي:</span>
                </h5>
                <div className="space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>البند والرمز الجمركي المقترح:</span>
                    <strong className="font-mono">{HS_CODES[cargoType].code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>نسبة الرسوم والتعرفة:</span>
                    <strong className="font-mono">{(HS_CODES[cargoType].dutyRate * 100)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>المتطلبات الجمركية للمواصفات:</span>
                    <strong>{HS_CODES[cargoType].requiresSpecialInspection ? 'تتطلب فحص وضبط جودة مخبري' : 'لا تتطلب فحصاً مخبرياً خاصاً'}</strong>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <PackageCheck size={16} />
                <span>إتمام الشراء وقص الفاتورة والبدء فوراً</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال توليد وطباعة التقارير والبيانات الجمركية الموحدة PDF */}
      <OfficialCustomsReportModal 
        shipments={shipments}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
