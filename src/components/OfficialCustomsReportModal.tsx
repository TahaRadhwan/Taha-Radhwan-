/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Shipment, CargoType, CustomsStatus } from '../types';
import { PORTS } from '../data';
import { 
  X, 
  Printer, 
  FileText, 
  SlidersHorizontal, 
  FileCheck2, 
  User, 
  Building, 
  Calendar, 
  Info,
  DollarSign,
  Scale,
  Award
} from 'lucide-react';

interface OfficialCustomsReportModalProps {
  shipments: Shipment[];
  isOpen: boolean;
  onClose: () => void;
}

export default function OfficialCustomsReportModal({ shipments, isOpen, onClose }: OfficialCustomsReportModalProps) {
  // تصفية وتصنيف المعاملات
  const [selectedPort, setSelectedPort] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCargo, setSelectedCargo] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'code' | 'date' | 'value' | 'weight'>('date');
  
  // مدخلات مخصصة للتقرير الرسمي
  const [reportTitle, setReportTitle] = useState<string>('تقرير كشف المعاملات الجمركية الموحدة');
  const [customNotes, setCustomNotes] = useState<string>('يرجى التكرم بالإحاطة بأن كافة البضائع والشحنات المذكورة أعلاه خاضعة للتفتيش الجمركي والمطابقة الفنية بموجب لوائح هيئة المواصفات والمقاييس بالجمهورية اليمنية، ويجري استكمال الرسوم والفسح جمركياً بانتظام.');
  const [reporterName, setReporterName] = useState<string>('طه رضوان');
  const [reportSerial, setReportSerial] = useState<string>(() => `TR-RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // تاريخ اليوم بالتنسيق العربي الهجري/الميلادي
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('ar-YE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // فلترة الشحنات بناء على الاختيارات
  const processedShipments = useMemo(() => {
    let result = [...shipments];

    if (selectedPort !== 'all') {
      result = result.filter(s => s.portOfDischarge === selectedPort);
    }
    if (selectedStatus !== 'all') {
      result = result.filter(s => s.currentStatus === selectedStatus);
    }
    if (selectedCargo !== 'all') {
      result = result.filter(s => s.cargoType === selectedCargo);
    }

    // الترتيب
    result.sort((a, b) => {
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      if (sortBy === 'value') return b.valueUSD - a.valueUSD;
      if (sortBy === 'weight') return b.weight - a.weight;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // date
    });

    return result;
  }, [shipments, selectedPort, selectedStatus, selectedCargo, sortBy]);

  // حساب المجاميع الكلية
  const totals = useMemo(() => {
    const count = processedShipments.length;
    const valueUSD = processedShipments.reduce((sum, s) => sum + (s.valueUSD || 0), 0);
    const weight = processedShipments.reduce((sum, s) => sum + (s.weight || 0), 0);
    
    // تقدير الرسوم الجمركية والضرائب (متوسط 15% من القيمة الإجمالية)
    const estimatedDuties = processedShipments.reduce((sum, s) => {
      const rate = s.dutyRate || 10;
      return sum + ((s.valueUSD * rate) / 100);
    }, 0);

    return { count, valueUSD, weight, estimatedDuties };
  }, [processedShipments]);

  if (!isOpen) return null;

  // إطلاق أمر الطباعة
  const handlePrint = () => {
    window.print();
  };

  const getStatusArabic = (status: CustomsStatus) => {
    switch (status) {
      case 'purchased': return 'شراء السلعة';
      case 'docs_ready': return 'الوثائق جاهزة';
      case 'arrived_at_port': return 'بالميناء / المنفذ';
      case 'declaration_submitted': return 'تقديم البيان';
      case 'inspection': return 'معاينة وتفتيش';
      case 'lab_testing': return 'فحص المقاييس';
      case 'payment_pending': return 'بانتظار الرسوم';
      case 'released': return 'الفسح الجمركي';
      case 'in_transit': return 'الترانزيت البري';
      case 'delivered': return 'مستلمة بالمستودع';
      default: return status;
    }
  };

  const getCargoArabic = (type: CargoType) => {
    switch (type) {
      case 'electronics': return 'إلكترونيات وتكنولوجيا';
      case 'food': return 'مواد غذائية وحجر';
      case 'clothes': return 'ملابس ومنسوجات';
      case 'industrial': return 'معدات وخطوط إنتاج';
      case 'cars': return 'مركبات وسيارات';
      case 'medical': return 'أدوية ومستلزمات طبية';
      case 'chemicals': return 'مواد كيميائية وبلاستيك';
      case 'building': return 'مواد بناء وحديد';
      case 'agriculture': return 'بذور ومعدات زراعية';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto no-print">
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] text-right font-sans">
        
        {/* لوحة التحكم والفلترة (الجانب الأيمن للويب) */}
        <div className="w-full md:w-80 bg-slate-950 p-6 border-l border-slate-800 space-y-6 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="إغلاق"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-emerald-400" />
                <h3 className="text-xs font-extrabold text-white">إعدادات الكشف والطباعة</h3>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* خصائص التقرير المخصصة */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block">العنوان المروّس للتقرير:</span>
              <input 
                type="text" 
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-white outline-none focus:border-emerald-500"
                placeholder="عنوان التقرير..."
              />
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block">اسم المخلص المسؤول:</span>
              <input 
                type="text" 
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-850 rounded-xl text-white outline-none focus:border-emerald-500"
                placeholder="اسم المخلص..."
              />
            </div>

            <hr className="border-slate-850" />

            {/* فلاتر الفهرسة والتوليد */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold block">تصفية حسب المنفذ الجمركي:</label>
                <select
                  value={selectedPort}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="all">جميع الموانئ والمنافذ</option>
                  {PORTS.map(p => (
                    <option key={p.id} value={p.nameAr}>{p.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold block">تصفية بحسب الخطوة الجمركية:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="all">جميع الحالات الجمركية</option>
                  <option value="purchased">1. شراء السلعة</option>
                  <option value="docs_ready">2. جهوزية الوثائق</option>
                  <option value="arrived_at_port">3. بالميناء والمنفذ</option>
                  <option value="declaration_submitted">4. تقديم البيان</option>
                  <option value="inspection">5. معاينة وتفتيش</option>
                  <option value="lab_testing">6. فحص المقاييس</option>
                  <option value="payment_pending">7. بانتظار الرسوم</option>
                  <option value="released">8. الفسح الجمركي</option>
                  <option value="in_transit">9. ترانزيت بري</option>
                  <option value="delivered">10. مستلمة بالمخزن</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold block">تصنيف ونوع السلعة:</label>
                <select
                  value={selectedCargo}
                  onChange={(e) => setSelectedCargo(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="all">جميع أنواع السلع والبضائع</option>
                  <option value="electronics">📱 الإلكترونيات</option>
                  <option value="food">🍎 الأغذية</option>
                  <option value="clothes">👕 الملابس</option>
                  <option value="industrial">⚙️ الصناعية</option>
                  <option value="cars">🚗 السيارات</option>
                  <option value="medical">💊 الأدوية</option>
                  <option value="chemicals">🧪 المواد الكيميائية</option>
                  <option value="building">🧱 مواد البناء والحديد</option>
                  <option value="agriculture">🌱 المنتجات الزراعية</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold block">فرز وترتيب السجلات:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="date">تاريخ الإنشاء (الأحدث)</option>
                  <option value="code">رمز المعاملة</option>
                  <option value="value">القيمة المالية المصرح بها</option>
                  <option value="weight">الأوزان الكلية بالطن</option>
                </select>
              </div>
            </div>

            <hr className="border-slate-850" />

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block">ملاحظات وتقرير المخلص الملحق:</label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={4}
                className="w-full text-[10px] px-2.5 py-2 bg-slate-900 border border-slate-850 rounded-xl text-white outline-none focus:border-emerald-500 resize-none leading-relaxed"
                placeholder="أدخل أي ملاحظات رسمية تود ظهورها أسفل الكشف..."
              />
            </div>

          </div>

          <button
            onClick={handlePrint}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Printer size={15} />
            <span>توليد وحفظ ملف PDF للطباعة</span>
          </button>
        </div>

        {/* مساحة عرض ومعاينة الورقة الرسمية A4 للطباعة */}
        <div className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto flex justify-center items-start">
          
          {/* محاكاة ورقة A4 حقيقية على المتصفح */}
          <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[15mm] md:p-[20mm] rounded-xl shadow-xl space-y-6 text-right relative border border-slate-200">
            
            {/* الخلفية المطبوعة والترويسة الرسمية */}
            <div className="border-b-4 border-emerald-600 pb-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* الجانب الأيمن: ترويسة يمنية رسمية */}
                <div className="text-center md:text-right space-y-1 text-xs">
                  <h1 className="font-bold text-slate-900 text-sm">الجمهورية اليمنية</h1>
                  <p className="text-slate-600">وزارة النقل والمواصلات</p>
                  <p className="text-slate-600">مصلحة الجمارك اليمنية العامة</p>
                  <p className="font-extrabold text-emerald-700 text-xs">مكتب طه رضوان للتخليص الجمركي والخدمات اللوجستية</p>
                  <p className="text-[10px] text-slate-500">عدن، صنعاء، منفذ شحن البري</p>
                </div>

                {/* المنتصف: شعار لوجستي وطني مصمم */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-600 rounded-full flex items-center justify-center text-emerald-700 font-extrabold text-xs shadow-xs">
                    <div className="text-center flex flex-col items-center">
                      <Award size={20} className="text-emerald-600" />
                      <span className="text-[8px] font-bold leading-none mt-0.5">TR LOGISTICS</span>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono tracking-wider font-bold">EST. 2020</span>
                </div>

                {/* الجانب الأيسر: بيانات التقرير */}
                <div className="text-center md:text-left space-y-1 text-[11px] text-slate-600 font-sans">
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="font-bold text-slate-900" style={{ direction: 'ltr' }}>{reportSerial}</span>
                    <span className="text-slate-500">:رقم المستند</span>
                  </div>
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="font-bold text-slate-900">{new Date().toISOString().split('T')[0]}</span>
                    <span className="text-slate-500">:تاريخ التصدير</span>
                  </div>
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="font-bold text-slate-900">{reporterName}</span>
                    <span className="text-slate-500">:المخلص المسؤول</span>
                  </div>
                  <div className="flex justify-center md:justify-end gap-1.5">
                    <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">رسمي معتمد</span>
                  </div>
                </div>

              </div>
            </div>

            {/* عنوان التقرير المركزي */}
            <div className="text-center py-2 bg-slate-50 border border-slate-100 rounded-xl">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">{reportTitle}</h2>
              <span className="text-[10px] text-slate-500 block mt-0.5">صادر رسمياً عن كشوفات ومناطق الفسح الجمركي والترانزيت التابعة للجمهورية اليمنية</span>
            </div>

            {/* البطاقات السريعة للإحصائيات في الطباعة */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block font-bold">عدد الشحنات</span>
                <span className="text-xs font-extrabold text-slate-800">{totals.count} معاملات</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block font-bold">القيمة المصرحة</span>
                <span className="text-xs font-extrabold text-slate-800" style={{ direction: 'ltr' }}>$ {totals.valueUSD.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-slate-500 block font-bold">الوزن الكلي</span>
                <span className="text-xs font-extrabold text-slate-800">{totals.weight.toLocaleString()} طن كلي</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[9px] text-emerald-600 block font-bold">الرسوم الجمركية المقدرة</span>
                <span className="text-xs font-extrabold text-emerald-700" style={{ direction: 'ltr' }}>$ {totals.estimatedDuties.toLocaleString()}</span>
              </div>
            </div>

            {/* جدول الشحنات الرسمي */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-800 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white border-b-2 border-emerald-600 text-right">
                    <th className="p-2 font-extrabold text-[10px] rounded-r-lg">الرمز</th>
                    <th className="p-2 font-extrabold text-[10px]">مسمى الشحنة</th>
                    <th className="p-2 font-extrabold text-[10px]">النوع</th>
                    <th className="p-2 font-extrabold text-[10px]">المورد / بلد المنشأ</th>
                    <th className="p-2 font-extrabold text-[10px]">المنفذ الجمركي</th>
                    <th className="p-2 font-extrabold text-[10px]">الأوزان (طن)</th>
                    <th className="p-2 font-extrabold text-[10px]">قيمة المعاملة</th>
                    <th className="p-2 font-extrabold text-[10px] rounded-l-lg text-center">خطوة التخليص الحالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {processedShipments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-[11px]">
                        لا توجد شحنات تطابق الفلاتر المحددة حالياً.
                      </td>
                    </tr>
                  ) : (
                    processedShipments.map((s, idx) => (
                      <tr key={s.id} className={idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}>
                        <td className="p-2 font-bold font-mono text-[10px] text-slate-600" style={{ direction: 'ltr' }}>{s.code}</td>
                        <td className="p-2 font-semibold text-slate-800 text-[10px]">{s.title}</td>
                        <td className="p-2 text-slate-600 text-[10px]">{getCargoArabic(s.cargoType)}</td>
                        <td className="p-2 text-slate-600 text-[10px]">{s.supplier} ({s.countryOfOrigin})</td>
                        <td className="p-2 text-slate-700 text-[10px]">{s.portOfDischarge}</td>
                        <td className="p-2 font-mono text-[10px]">{s.weight} طن</td>
                        <td className="p-2 font-bold font-mono text-emerald-700 text-[10px]" style={{ direction: 'ltr' }}>$ {s.valueUSD.toLocaleString()}</td>
                        <td className="p-2 text-center text-[9px] font-extrabold">
                          <span className={`px-2 py-0.5 rounded-full border ${
                            s.currentStatus === 'released' || s.currentStatus === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : s.currentStatus === 'payment_pending'
                                ? 'bg-orange-50 text-orange-700 border-orange-100'
                                : s.currentStatus === 'inspection' || s.currentStatus === 'lab_testing'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {getStatusArabic(s.currentStatus)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ملاحظات المخلص الإضافية في التقرير */}
            <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl space-y-1.5 text-xs text-slate-700">
              <span className="font-extrabold text-slate-900 block text-[11px]">ملاحظات وتوجيهات مكتب التخليص والجمارك:</span>
              <p className="leading-relaxed text-[10px] text-slate-600">{customNotes}</p>
            </div>

            {/* الختم وتواقيع الاعتماد */}
            <div className="pt-8 border-t border-dashed border-slate-300">
              <div className="flex justify-between items-end gap-4">
                
                {/* الجهة الأولى: التوقيع */}
                <div className="text-center w-48 space-y-8">
                  <span className="text-[10px] font-bold text-slate-500 block">توقيع المسؤول الجمركي بمكتب عدن:</span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 border-b border-slate-300 pb-1 px-4 block">طه رضوان اللوجستية</span>
                    <span className="text-[9px] text-slate-400 block font-mono">طه رضوان - المدير العام</span>
                  </div>
                </div>

                {/* الجهة الوسطى: الختم الدائري الرسمي لمكتب طه رضوان للخدمات اللوجستية */}
                <div className="flex flex-col items-center justify-center relative">
                  <div className="w-24 h-24 border-4 border-double border-emerald-600 rounded-full flex items-center justify-center text-center text-emerald-700 font-extrabold select-none rotate-6 opacity-85 hover:scale-105 transition-transform p-1 bg-emerald-50/10">
                    <div className="text-[8px] leading-tight flex flex-col items-center">
                      <span className="font-bold">مكتب طه رضوان</span>
                      <span className="text-[6px] text-slate-500">للخدمات اللوجستية</span>
                      <div className="border-t border-b border-emerald-600 py-0.5 px-1 my-0.5 text-[6px] font-mono">
                        ★ معتمد جمركياً ★
                      </div>
                      <span className="text-[5px]">الجمهورية اليمنية</span>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold block mt-1.5">الختم الجمركي الرسمي لمكتب التخليص</span>
                </div>

                {/* الجهة الثالثة: مصلحة الجمارك وهيئة المواصفات */}
                <div className="text-center w-48 space-y-8">
                  <span className="text-[10px] font-bold text-slate-500 block">اعتماد مأمور مصلحة الجمارك العامة:</span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-400 border-b border-slate-300 pb-1 px-4 block">توقيع وختم المنفذ الجمركي</span>
                    <span className="text-[9px] text-slate-400 block">ميناء عدن / منفذ شحن</span>
                  </div>
                </div>

              </div>
            </div>

            {/* الحاشية السفلية للصفحة في الطباعة */}
            <div className="absolute bottom-4 left-0 right-0 px-8 text-center text-[8px] text-slate-400 flex justify-between items-center border-t border-slate-100 pt-2">
              <span>تاريخ الإصدار: {currentDateFormatted}</span>
              <span className="font-bold">طه رضوان للخدمات اللوجستية والتخليص الجمركي</span>
              <span>صفحة 1 من 1</span>
            </div>

          </div>
        </div>

      </div>

      {/* نموذج التقرير الخاص بالطباعة فقط (يتم وضعه بمستوى أعلى بالصفحة وتهيئته بالـ CSS) */}
      <div className="hidden print-only official-pdf-report text-slate-900 text-right font-sans leading-normal">
        {/* الترويسة بالطباعة */}
        <div className="border-b-4 border-emerald-600 pb-3 mb-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1 text-xs">
              <h1 className="font-bold text-slate-900 text-sm">الجمهورية اليمنية</h1>
              <p className="text-slate-600">وزارة النقل والمواصلات - مصلحة الجمارك اليمنية</p>
              <p className="font-extrabold text-emerald-700 text-xs">مكتب طه رضوان للخدمات اللوجستية والتخليص الجمركي</p>
            </div>
            
            <div className="text-center">
              <span className="font-extrabold text-emerald-800 border-2 border-emerald-600 rounded px-3 py-1 bg-emerald-50/10 text-xs">TR LOGISTICS</span>
            </div>

            <div className="text-left text-[11px] text-slate-600">
              <p>رقم المستند: <strong>{reportSerial}</strong></p>
              <p>تاريخ التصدير: <strong>{new Date().toISOString().split('T')[0]}</strong></p>
              <p>المخلص المسؤول: <strong>{reporterName}</strong></p>
            </div>
          </div>
        </div>

        {/* عنوان التقرير المركزي بالطباعة */}
        <div className="text-center py-2 bg-slate-100 border border-slate-200 rounded-xl mb-4">
          <h2 className="text-sm font-extrabold text-slate-800">{reportTitle}</h2>
          <span className="text-[9px] text-slate-500">صادر رسمياً ومباشرة من لوحة التخليص السحابية لمكتب طه رضوان</span>
        </div>

        {/* الإحصائيات بالطباعة */}
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
            <span className="text-[9px] text-slate-500 block font-bold">عدد الشحنات</span>
            <span className="text-xs font-extrabold text-slate-800">{totals.count} معاملات</span>
          </div>
          <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
            <span className="text-[9px] text-slate-500 block font-bold">القيمة الكلية</span>
            <span className="text-xs font-extrabold text-slate-800" style={{ direction: 'ltr' }}>$ {totals.valueUSD.toLocaleString()}</span>
          </div>
          <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
            <span className="text-[9px] text-slate-500 block font-bold">الوزن الإجمالي</span>
            <span className="text-xs font-extrabold text-slate-800">{totals.weight.toLocaleString()} طن</span>
          </div>
          <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
            <span className="text-[9px] text-emerald-700 block font-bold">الرسوم الجمركية المقدرة</span>
            <span className="text-xs font-extrabold text-emerald-700" style={{ direction: 'ltr' }}>$ {totals.estimatedDuties.toLocaleString()}</span>
          </div>
        </div>

        {/* جدول المعاملات بالطباعة */}
        <table className="w-full text-[10px] text-slate-800 border-collapse mb-4 border border-slate-200">
          <thead>
            <tr className="bg-slate-900 text-white text-right">
              <th className="p-2 font-bold border border-slate-200">الرمز</th>
              <th className="p-2 font-bold border border-slate-200">مسمى الشحنة والبيان</th>
              <th className="p-2 font-bold border border-slate-200">النوع</th>
              <th className="p-2 font-bold border border-slate-200">المورد والمنشأ</th>
              <th className="p-2 font-bold border border-slate-200">الميناء / المنفذ</th>
              <th className="p-2 font-bold border border-slate-200">الوزن</th>
              <th className="p-2 font-bold border border-slate-200">القيمة</th>
              <th className="p-2 font-bold border border-slate-200 text-center">حالة التخليص</th>
            </tr>
          </thead>
          <tbody>
            {processedShipments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">لا توجد شحنات تطابق الفلاتر حالياً.</td>
              </tr>
            ) : (
              processedShipments.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="p-1.5 font-mono border border-slate-200">{s.code}</td>
                  <td className="p-1.5 font-bold border border-slate-200">{s.title}</td>
                  <td className="p-1.5 border border-slate-200">{getCargoArabic(s.cargoType)}</td>
                  <td className="p-1.5 border border-slate-200">{s.supplier} ({s.countryOfOrigin})</td>
                  <td className="p-1.5 border border-slate-200">{s.portOfDischarge}</td>
                  <td className="p-1.5 border border-slate-200">{s.weight} طن</td>
                  <td className="p-1.5 font-bold font-mono text-emerald-800 border border-slate-200" style={{ direction: 'ltr' }}>$ {s.valueUSD.toLocaleString()}</td>
                  <td className="p-1.5 text-center border border-slate-200 text-[9px] font-extrabold">{getStatusArabic(s.currentStatus)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* الملاحظات بالطباعة */}
        <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg text-[10px] text-slate-700 mb-6">
          <span className="font-extrabold text-slate-900 block mb-1">ملاحظات وتوجيهات مكتب التخليص والجمارك:</span>
          <p className="leading-relaxed">{customNotes}</p>
        </div>

        {/* التواقيع والختم بالطباعة */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <div className="text-center w-40">
              <span className="text-[10px] font-bold text-slate-500 block mb-4">توقيع المسؤول الجمركي:</span>
              <span className="text-xs font-bold text-slate-800 border-b border-slate-300 pb-1 px-3 block">طه رضوان اللوجستية</span>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 border-4 border-double border-emerald-600 rounded-full flex items-center justify-center text-center text-emerald-700 font-extrabold select-none rotate-6 p-1 bg-emerald-50/10">
                <div className="text-[7px] leading-tight flex flex-col items-center">
                  <span className="font-bold">مكتب طه رضوان</span>
                  <span className="text-[5px] text-slate-500">للخدمات اللوجستية</span>
                  <span className="text-[5px] font-mono">★ معتمد جمركياً ★</span>
                </div>
              </div>
              <span className="text-[7px] text-slate-400 block mt-1">الختم الرسمي لمكتب التخليص</span>
            </div>

            <div className="text-center w-40">
              <span className="text-[10px] font-bold text-slate-500 block mb-4">اعتماد مأمور مصلحة الجمارك:</span>
              <span className="text-xs font-bold text-slate-400 border-b border-slate-300 pb-1 px-3 block">توقيع وختم المنفذ</span>
            </div>
          </div>
        </div>

        {/* الحاشية بالطباعة */}
        <div className="mt-8 pt-2 border-t border-slate-200 flex justify-between text-[8px] text-slate-400">
          <span>صادر بتاريخ: {currentDateFormatted}</span>
          <span>طه رضوان للتخليص الجمركي والخدمات اللوجستية</span>
          <span>صفحة 1 من 1</span>
        </div>
      </div>

    </div>
  );
}
