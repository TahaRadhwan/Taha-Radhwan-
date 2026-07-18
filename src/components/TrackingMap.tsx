/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Shipment } from '../types';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Compass, 
  Anchor, 
  Truck, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Info,
  Ship,
  CheckCircle2,
  Map as MapIcon
} from 'lucide-react';

interface TrackingMapProps {
  shipments: Shipment[];
}

export default function TrackingMap({ shipments }: TrackingMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(shipments[0]?.id || '');

  const activeShipment = shipments.find(s => s.id === selectedShipmentId) || 
                         shipments.find(s => s.trackingNumber === searchQuery) ||
                         shipments.find(s => s.code === searchQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const found = shipments.find(
      s => s.trackingNumber?.toLowerCase() === searchQuery.trim().toLowerCase() ||
           s.code.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (found) {
      setSelectedShipmentId(found.id);
    } else {
      alert("عذراً، لم يتم العثور على أي شحنة برقم التتبع أو الرمز المدخل.");
    }
  };

  // تحديد مسار الإحداثيات الجغرافية التقريبية للـ SVG بناء على الميناء والشحنة
  const getCoordinatesForShipment = (shipment: Shipment) => {
    const status = shipment.currentStatus;
    
    // إحداثيات افتراضية على لوحة SVG (العرض 600، الارتفاع 300)
    // نقطة البداية (المنشأ الخارجي): (80, 100)
    // نقطة العبور (المحيط/البحر): (250, 150)
    // نقطة المخطاف (خليج عدن/البحر الأحمر): (400, 180)
    // ميناء التخليص اليمني: عدن (450, 220)، الحديدة (400, 200)، المكلا (500, 210)
    // مستودع التاجر (الوصول البري): صنعاء (420, 140)، عدن (460, 230)، مأرب (470, 150)

    let dischargePort = { x: 450, y: 220, name: shipment.portOfDischarge };
    if (shipment.portOfDischarge.includes('الحديدة')) {
      dischargePort = { x: 400, y: 190, name: 'ميناء الحديدة' };
    } else if (shipment.portOfDischarge.includes('المكلا')) {
      dischargePort = { x: 520, y: 210, name: 'ميناء المكلا' };
    } else if (shipment.portOfDischarge.includes('شحن')) {
      dischargePort = { x: 560, y: 160, name: 'منفذ شحن' };
    } else if (shipment.portOfDischarge.includes('الوديعة')) {
      dischargePort = { x: 490, y: 160, name: 'منفذ الوديعة' };
    } else if (shipment.portOfDischarge.includes('صنعاء')) {
      dischargePort = { x: 420, y: 170, name: 'مطار صنعاء' };
    }

    let finalDest = { x: 440, y: 150, name: shipment.clientName || 'مستودع التاجر' };
    if (shipment.clientName?.includes('مأرب')) {
      finalDest = { x: 460, y: 160, name: 'مستودع العميل بمأرب' };
    } else if (shipment.clientName?.includes('المطاحن') || shipment.portOfDischarge.includes('الحديدة')) {
      finalDest = { x: 410, y: 180, name: 'مخازن الصوامع بالحديدة' };
    } else if (shipment.portOfDischarge.includes('عدن')) {
      finalDest = { x: 450, y: 230, name: 'المخازن المركزية بعدن' };
    }

    const start = { x: 80, y: 100, name: shipment.countryOfOrigin };
    const middle = { x: 260, y: 140, name: 'المياه الإقليمية الدولية' };

    // حساب الموقع الحالي بناءً على الحالة الحالية للشحنة
    let current = { x: start.x, y: start.y, icon: 'ship' };

    switch (status) {
      case 'purchased':
        current = { x: start.x, y: start.y, icon: 'ship' };
        break;
      case 'docs_ready':
        current = { x: (start.x + middle.x) / 2, y: (start.y + middle.y) / 2, icon: 'ship' };
        break;
      case 'arrived_at_port':
        current = { x: middle.x, y: middle.y, icon: 'ship' };
        break;
      case 'declaration_submitted':
      case 'inspection':
      case 'lab_testing':
        current = { x: (middle.x + dischargePort.x) / 2 + 10, y: (middle.y + dischargePort.y) / 2 + 10, icon: 'ship' };
        break;
      case 'payment_pending':
      case 'released':
        current = { x: dischargePort.x, y: dischargePort.y, icon: 'anchor' };
        break;
      case 'in_transit':
        current = { x: (dischargePort.x + finalDest.x) / 2, y: (dischargePort.y + finalDest.y) / 2, icon: 'truck' };
        break;
      case 'delivered':
        current = { x: finalDest.x, y: finalDest.y, icon: 'check' };
        break;
    }

    return { start, middle, dischargePort, finalDest, current };
  };

  // حالة التتبع اللفظية المطوبة
  const getTrackingStatusText = (shipment: Shipment) => {
    const status = shipment.currentStatus;
    if (status === 'delivered') {
      return {
        text: 'جاهزة للاستلام وتم التفريغ',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        badge: 'bg-emerald-600',
        step: 3
      };
    } else if (status === 'released' || status === 'in_transit') {
      return {
        text: 'مفرجة جمركياً / في الطريق',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        badge: 'bg-blue-600',
        step: 2
      };
    } else if (status === 'payment_pending' || status === 'lab_testing' || status === 'inspection' || status === 'declaration_submitted') {
      return {
        text: 'تم التخليص الجمركي / قيد التدقيق النهائي',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badge: 'bg-amber-600',
        step: 1
      };
    } else {
      return {
        text: 'قيد الإبحار / جاري التجهيز للوصول',
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        badge: 'bg-gray-400',
        step: 0
      };
    }
  };

  return (
    <div id="tracking_realtime_container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* جهة اليمين: البحث السريع وقائمة تتبع الشحنات */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
            <Compass size={18} className="text-emerald-600" />
            <span>نظام التتبع الجغرافي اللوجستي</span>
          </h3>
          <p className="text-[10px] text-gray-400 mt-1">تتبع حاويات الاستيراد والتصدير لليمن والشرق الأوسط لحظياً</p>
        </div>

        {/* نموذج البحث برقم التتبع */}
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="أدخل رقم التتبع (مثال: TRK-YE-90214)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans pl-10 pr-3 py-2.5 rounded-xl border border-gray-150 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50/50"
          />
          <button 
            type="submit"
            className="absolute left-2.5 top-2.5 text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <Search size={16} />
          </button>
        </form>

        {/* قائمة الشحنات سريعة الاختيار للتتبع */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          <span className="text-[10px] text-gray-400 font-bold block mb-1">الشحنات النشطة المتاحة للتتبع:</span>
          {shipments.map(s => {
            const trackStatus = getTrackingStatusText(s);
            const isSelected = activeShipment?.id === s.id;
            return (
              <div 
                key={s.id}
                onClick={() => setSelectedShipmentId(s.id)}
                className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-gray-800 line-clamp-1">{s.title}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-gray-400">{s.trackingNumber || `TRK-${s.code}`}</span>
                    <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-sans">{s.direction === 'export' ? 'صادرات' : 'واردات'}</span>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${trackStatus.badge} text-white`}>
                    {s.currentStatus === 'delivered' ? 'مكتمل' : 'نشط'}
                  </span>
                  <span className="text-[8px] text-gray-400">{s.portOfDischarge.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* كارت معلومات الشريك اللوجستي */}
        <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-900/40 relative overflow-hidden">
          <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-emerald-800/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-800/30 rounded-lg text-emerald-300">
              <Navigation size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-white">طه رضوان للخدمات اللوجستية</h4>
              <p className="text-[9px] text-emerald-300/80 leading-relaxed">
                مكتب التخليص والنقل الدولي المعتمد لليمن. ربط موانئ عدن، الحديدة، المكلا، ومنفذي شحن والوديعة مع خطوط الملاحة العالمية Maersk, MSC, COSCO.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* جهة اليسار: خريطة الـ SVG التفاعلية وتفاصيل مسار الشحنة المحددة */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* الخريطة الجغرافية التفاعلية */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapIcon size={18} className="text-emerald-600" />
              <h4 className="text-xs font-extrabold text-gray-850">
                المسار الجغرافي للشحنة: <span className="text-emerald-700 font-mono">{activeShipment?.code}</span>
              </h4>
            </div>
            {activeShipment && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getTrackingStatusText(activeShipment).color}`}>
                {getTrackingStatusText(activeShipment).text}
              </span>
            )}
          </div>

          {activeShipment ? (
            (() => {
              const coords = getCoordinatesForShipment(activeShipment);
              const trackStatus = getTrackingStatusText(activeShipment);

              return (
                <div className="space-y-4">
                  {/* حاوية الخريطة المرسومة بـ SVG */}
                  <div className="border border-gray-100 rounded-2xl bg-slate-900 overflow-hidden relative h-[240px] md:h-[300px]">
                    
                    {/* جزئية الـ SVG المخصصة لساحل اليمن والبحر الأحمر وخليج عدن */}
                    <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
                      
                      {/* خلفية مائية تمثل البحر */}
                      <rect width="600" height="300" fill="#0f172a" />
                      
                      {/* رسم خيالي لليابسة (اليمن والمناطق المجاورة) */}
                      {/* اليمن تقع في جهة اليمين والوسط السفلي */}
                      <path 
                        d="M 330 140 Q 380 120 420 130 T 490 140 T 580 120 L 600 300 L 300 300 Z" 
                        fill="#1e293b" 
                        opacity="0.7" 
                      />
                      
                      {/* رسم خيالي لأفريقيا والقرن الأفريقي في الجنوب الغربي واليسار */}
                      <path 
                        d="M 0 160 Q 100 180 180 230 T 260 300 L 0 300 Z" 
                        fill="#1e293b" 
                        opacity="0.5" 
                      />

                      {/* مضيق باب المندب كخط مائي رائع */}
                      <path 
                        d="M 310 180 L 360 210" 
                        stroke="#0f172a" 
                        strokeWidth="10" 
                        strokeLinecap="round" 
                        opacity="0.8" 
                      />

                      {/* شبكة جغرافية خفيفة للتصميم */}
                      <line x1="100" y1="0" x2="100" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="300" y1="0" x2="300" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="500" y1="0" x2="500" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="0" y1="100" x2="600" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="0" y1="200" x2="600" y2="200" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />

                      {/* خط سير الشحنة (من المنشأ للميناء ثم المستودع) */}
                      {/* 1. مسار بحري متقطع */}
                      <path 
                        d={`M ${coords.start.x} ${coords.start.y} Q ${coords.middle.x} ${coords.middle.y} ${coords.dischargePort.x} ${coords.dischargePort.y}`} 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2" 
                        strokeDasharray="4,4" 
                      />

                      {/* 2. مسار بري إلى المستودع النهائي */}
                      <path 
                        d={`M ${coords.dischargePort.x} ${coords.dischargePort.y} L ${coords.finalDest.x} ${coords.finalDest.y}`} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2" 
                        strokeDasharray="2,2" 
                      />

                      {/* رسم النقاط الرئيسية للمحطات */}
                      {/* نقطة البداية (دولة المنشأ) */}
                      <circle cx={coords.start.x} cy={coords.start.y} r="6" fill="#10b981" />
                      <text x={coords.start.x - 10} y={coords.start.y - 12} fill="#94a3b8" fontSize="9" fontWeight="bold">
                        {coords.start.name} (المنشأ)
                      </text>

                      {/* نقطة ميناء التخليص اليمني */}
                      <circle cx={coords.dischargePort.x} cy={coords.dischargePort.y} r="6" fill="#f59e0b" />
                      <text x={coords.dischargePort.x - 20} y={coords.dischargePort.y - 12} fill="#f8fafc" fontSize="10" fontWeight="bold">
                        {coords.dischargePort.name}
                      </text>

                      {/* نقطة المستودع النهائي */}
                      <circle cx={coords.finalDest.x} cy={coords.finalDest.y} r="6" fill="#3b82f6" />
                      <text x={coords.finalDest.x - 20} y={coords.finalDest.y + 16} fill="#94a3b8" fontSize="9" fontWeight="bold">
                        {coords.finalDest.name}
                      </text>

                      {/* رسم الأيقونة المتحركة النشطة للموقع الحالي */}
                      <g transform={`translate(${coords.current.x - 12}, ${coords.current.y - 12})`}>
                        <circle cx="12" cy="12" r="14" fill="#10b981" opacity="0.2" className="animate-ping" />
                        <circle cx="12" cy="12" r="10" fill="#10b981" />
                        {coords.current.icon === 'ship' && (
                          <path d="M 6 13 L 18 13 L 15 17 L 9 17 Z M 9 13 L 9 9 L 12 11 L 12 13" stroke="white" strokeWidth="1.5" fill="none" />
                        )}
                        {coords.current.icon === 'anchor' && (
                          <path d="M 12 5 L 12 17 M 8 9 L 16 9 M 7 13 A 5 5 0 0 0 17 13" stroke="white" strokeWidth="1.5" fill="none" />
                        )}
                        {coords.current.icon === 'truck' && (
                          <path d="M 5 15 L 14 15 L 14 9 L 5 9 Z M 14 15 L 18 15 L 18 11 L 14 11 Z" stroke="white" strokeWidth="1.5" fill="none" />
                        )}
                        {coords.current.icon === 'check' && (
                          <path d="M 7 12 L 10 15 L 17 8" stroke="white" strokeWidth="2" fill="none" />
                        )}
                      </g>

                    </svg>

                    {/* ويدجت صغيرة عائمة للموقع الحالي التفصيلي */}
                    <div className="absolute bottom-3 right-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-right">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-400 block font-sans">الموقع الجغرافي التقريبي الحالي للشحنة:</span>
                        <p className="text-[10px] text-slate-100 font-bold flex items-center gap-1.5">
                          <MapPin size={10} className="text-emerald-500" />
                          <span>{activeShipment.currentLocation || 'عرض البحر - مياه خليج عدن الإقليمية'}</span>
                        </p>
                      </div>
                      <div className="text-left font-sans">
                        <span className="text-[8px] text-slate-400 block">زمن الوصول المتوقع (ETA):</span>
                        <strong className="text-[10px] text-emerald-400 block">{activeShipment.estimatedArrival || 'خلال أيام'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* الـ 3 خطوات المطلوبة لعرض الحالة: "في الطريق"، "تم التخليص الجمركي"، "جاهزة للاستلام" */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50/70 p-3 rounded-2xl border border-gray-100 text-center relative">
                    
                    {/* الخط الأول */}
                    <div className={`p-2.5 rounded-xl border transition-all ${trackStatus.step >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-150 text-gray-400'}`}>
                      <div className="flex justify-center mb-1">
                        <ShieldCheck size={16} className={trackStatus.step >= 1 ? 'text-emerald-600' : 'text-gray-300'} />
                      </div>
                      <span className="text-[10px] font-bold block">1. تم التخليص الجمركي</span>
                      <span className="text-[8px] block opacity-75">إجراء الفحص والمطابقة</span>
                    </div>

                    {/* الخط الثاني */}
                    <div className={`p-2.5 rounded-xl border transition-all ${trackStatus.step >= 2 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-150 text-gray-400'}`}>
                      <div className="flex justify-center mb-1">
                        <Truck size={16} className={trackStatus.step >= 2 ? 'text-blue-600' : 'text-gray-300'} />
                      </div>
                      <span className="text-[10px] font-bold block">2. في الطريق برياً</span>
                      <span className="text-[8px] block opacity-75">تحرك الشاحنة والختم جمركي</span>
                    </div>

                    {/* الخط الثالث */}
                    <div className={`p-2.5 rounded-xl border transition-all ${trackStatus.step >= 3 ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'bg-white border-gray-150 text-gray-400'}`}>
                      <div className="flex justify-center mb-1">
                        <CheckCircle2 size={16} className={trackStatus.step >= 3 ? 'text-white' : 'text-gray-300'} />
                      </div>
                      <span className="text-[10px] font-bold block">3. جاهزة للاستلام ومفرغة</span>
                      <span className="text-[8px] block opacity-90">وصول مخزن التاجر بالكامل</span>
                    </div>

                  </div>

                  {/* بطاقة التفاصيل الفنية للشحنة المتبعة */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block">شركة الشحن البحري:</span>
                      <strong className="text-xs text-gray-700 block">{activeShipment.carrierName}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block">رقم الحاوية الموحد:</span>
                      <strong className="text-xs text-gray-700 font-mono block">{activeShipment.containerNumber}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block">الوزن الكلي للشحنة:</span>
                      <strong className="text-xs text-gray-700 block">{activeShipment.weight} طن متري</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block">قيمة جمارك المعاملة:</span>
                      <strong className="text-xs text-emerald-700 block font-bold">
                        {activeShipment.valueUSD.toLocaleString()} USD
                        <span className="text-[9px] text-gray-400 block">({activeShipment.valueLocal.toLocaleString()} ريال يمني)</span>
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <Compass size={40} className="mx-auto text-gray-200" />
              <p className="text-xs">الرجاء اختيار أو البحث عن شحنة جمركية للبدء في تتبع مسارها جغرافياً في اليمن</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
