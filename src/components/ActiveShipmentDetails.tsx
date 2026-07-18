/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shipment, CustomsStatus, Document, CargoType } from '../types';
import { TIMELINE_STEPS, HS_CODES, PORTS, CARRIERS, generateContainerNumber } from '../data';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Activity, 
  FileCheck, 
  FileText, 
  DollarSign, 
  Truck, 
  Package,
  Anchor, 
  Scan, 
  FlaskConical, 
  CreditCard, 
  Lock, 
  Unlock, 
  MapPin, 
  Building 
} from 'lucide-react';
import DocumentManager from './DocumentManager';

interface ActiveShipmentDetailsProps {
  shipment: Shipment;
  onUpdateShipment: (updated: Shipment) => void;
  onBackToList: () => void;
}

export default function ActiveShipmentDetails({ shipment, onUpdateShipment, onBackToList }: ActiveShipmentDetailsProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simText, setSimText] = useState('');
  
  // لخطوة المعاينة
  const [isXrayDone, setIsXrayDone] = useState(false);
  const [isPhysicalDone, setIsPhysicalDone] = useState(false);

  // لخطوة فحص المواصفات
  const [isLabSamplePulled, setIsLabSamplePulled] = useState(false);

  // لخطوة سداد الرسوم
  const [paymentCode, setPaymentCode] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // لخطوة النقل البري
  const [transitPercent, setTransitPercent] = useState(shipment.transitProgress || 0);

  // لخطوة تفريغ البضاعة بالمخازن
  const [isSealCut, setIsSealCut] = useState(false);
  const [isInventoryMatched, setIsInventoryMatched] = useState(false);

  const hsItem = HS_CODES[shipment.cargoType];

  // مزامنة الخطوة المحددة مع حالة الشحنة عند تغيير الشحنة النشطة
  useEffect(() => {
    const activeIndex = TIMELINE_STEPS.findIndex(step => step.status === shipment.currentStatus);
    if (selectedStepIndex !== (activeIndex >= 0 ? activeIndex : 0)) {
      setSelectedStepIndex(activeIndex >= 0 ? activeIndex : 0);
    }
    
    // تصفير المتغيرات الفرعية بذكاء مع التحقق من التغيير الفعلي
    const expectedXray = shipment.currentStatus === 'payment_pending' || shipment.currentStatus === 'released' || shipment.currentStatus === 'delivered';
    if (isXrayDone !== expectedXray) {
      setIsXrayDone(expectedXray);
    }

    const expectedPhysical = shipment.currentStatus === 'payment_pending' || shipment.currentStatus === 'released' || shipment.currentStatus === 'delivered';
    if (isPhysicalDone !== expectedPhysical) {
      setIsPhysicalDone(expectedPhysical);
    }

    const expectedLabSample = shipment.currentStatus === 'payment_pending' || shipment.currentStatus === 'released' || shipment.currentStatus === 'delivered';
    if (isLabSamplePulled !== expectedLabSample) {
      setIsLabSamplePulled(expectedLabSample);
    }

    const expectedTransit = shipment.transitProgress || 0;
    if (transitPercent !== expectedTransit) {
      setTransitPercent(expectedTransit);
    }

    const expectedSealCut = shipment.currentStatus === 'delivered';
    if (isSealCut !== expectedSealCut) {
      setIsSealCut(expectedSealCut);
    }

    const expectedInventoryMatched = shipment.currentStatus === 'delivered';
    if (isInventoryMatched !== expectedInventoryMatched) {
      setIsInventoryMatched(expectedInventoryMatched);
    }
  }, [shipment.id, shipment.currentStatus, shipment.transitProgress]);

  // تحديث حالة الشحنة إلى الخطوة التالية مع تسجيل السجلات جمركياً
  const advanceToStatus = (nextStatus: CustomsStatus, logMessage: string) => {
    const updatedLogs = [
      ...shipment.logs,
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: nextStatus,
        message: logMessage,
        userAction: true
      }
    ];

    const updatedDocs = [...shipment.documents];

    // لو تقدمنا لخطوة تقديم البيان الجمركي، نقوم بتحديث البيان الجمركي في الوثائق
    if (nextStatus === 'declaration_submitted') {
      const decDoc = updatedDocs.find(d => d.type === 'declaration');
      if (decDoc) {
        decDoc.status = 'completed';
        decDoc.content.hsCode = hsItem.code;
        decDoc.content.dutiesAmount = Math.round(shipment.valueLocal * hsItem.dutyRate);
        decDoc.content.vatAmount = Math.round(shipment.valueLocal * 0.15); // 15% VAT
        decDoc.content.portFees = 1800; // رسوم ميناء موحدة
      }
    }

    // لو سددنا الرسوم وتقدمنا للفسح
    if (nextStatus === 'released') {
      const relDoc = updatedDocs.find(d => d.type === 'release');
      if (relDoc) {
        relDoc.status = 'completed';
        relDoc.content.dutiesAmount = Math.round(shipment.valueLocal * hsItem.dutyRate);
      }
    }

    // لو اكتملت الدورة
    let deliveredAt: string | undefined = undefined;
    if (nextStatus === 'delivered') {
      deliveredAt = new Date().toISOString().split('T')[0];
    }

    onUpdateShipment({
      ...shipment,
      currentStatus: nextStatus,
      documents: updatedDocs,
      logs: updatedLogs,
      dutiesPaid: nextStatus === 'released' || nextStatus === 'in_transit' || nextStatus === 'delivered' ? true : shipment.dutiesPaid,
      transitProgress: nextStatus === 'delivered' ? 100 : transitPercent,
      deliveredAt: deliveredAt
    });
  };

  const getStepStatusClass = (stepIndex: number, currentStepIndex: number) => {
    if (stepIndex < currentStepIndex) {
      return 'bg-emerald-600 border-emerald-600 text-white'; // منتهية
    } else if (stepIndex === currentStepIndex) {
      return 'bg-amber-500 border-amber-500 text-white ring-4 ring-amber-100 animate-pulse'; // الحالية
    } else {
      return 'bg-white border-gray-200 text-gray-400'; // تالية
    }
  };

  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.status === shipment.currentStatus);

  // محاكاة سحب عينة مخبرية وإرسالها للمختبر الوطني
  const handleStartLabTest = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimText('جاري سحب عينة عشوائية مغلقة من الحاوية جمركياً...');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        setSimulationProgress(100);
        setIsSimulating(false);
        setIsLabSamplePulled(true);
        
        // تحديث مستند شهادة الجودة
        const updatedDocs = shipment.documents.map(d => {
          if (d.type === 'quality') {
            return {
              ...d,
              status: 'completed' as const,
              content: {
                ...d.content,
                labNotes: `تم تحليل العينات المسحوبة من الحاوية رقم ${shipment.containerNumber} بنجاح ومطابقتها لمواصفات الهيئة العامة لضبط الجودة ومقاييس السلامة الوطنية لعام 2026.`
              }
            };
          }
          return d;
        });

        onUpdateShipment({
          ...shipment,
          labResult: 'passed',
          documents: updatedDocs,
          logs: [
            ...shipment.logs,
            {
              id: `log_lab_${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              status: 'lab_testing',
              message: 'ظهرت نتائج الفحص المخبري للمطابقة والمقاييس: الشحنة سليمة ومطابقة للمواصفات وصالحة للاستهلاك والاستيراد الرسمي.',
              userAction: false
            }
          ]
        });
      } else {
        setSimulationProgress(progress);
        if (progress === 35) setSimText('إرسال العينة في صندوق تبريد مصفح لمعامل الهيئة العامة للغذاء والدواء والمقاييس...');
        if (progress === 65) setSimText('بدء الفحص التقني وتحليل المركبات والمطابقة للمواصفات القياسية المعتمدة...');
        if (progress === 85) setSimText('اعتماد الفحص المخبري وإصدار شهادة الصلاحية الوطنية...');
      }
    }, 150);
  };

  // محاكاة سداد الرسوم الجمركية والضرائب الموحدة
  const handleProcessPayment = () => {
    if (!paymentCode || paymentCode.length < 5) {
      alert("يرجى إدخال رمز السداد السريع المكون من 6 أرقام (مثال: 902813)");
      return;
    }
    
    setIsPaymentProcessing(true);
    setSimText('جاري التحقق من رقم الفاتورة الموحدة وتوفر الرصيد البنكي للتاجر...');
    
    setTimeout(() => {
      setIsPaymentProcessing(false);
      const totalFees = Math.round(shipment.valueLocal * hsItem.dutyRate) + Math.round(shipment.valueLocal * 0.15) + 1800;
      advanceToStatus('released', `تم سداد الرسوم الجمركية الموحدة بقيمة ${totalFees.toLocaleString()} ريال بنجاح برقم إيصال دفع PAY-SYS-${paymentCode}.`);
    }, 2000);
  };

  // محاكاة تحرك شاحنة النقل البري
  const handleStartTransit = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimText('تحميل الحاوية وربط قفل الأمان والختم الجمركي على الشاحنة...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setTransitPercent(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setSimulationProgress(100);
        setIsSimulating(false);
        
        onUpdateShipment({
          ...shipment,
          transitProgress: 100,
          logs: [
            ...shipment.logs,
            {
              id: `log_trans_${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              status: 'in_transit',
              message: 'وصلت الشاحنة محملة بالحاوية بسلام إلى مستودعات التاجر الرئيسية، والختم الجمركي سليم وبحالة ممتازة.',
              userAction: false
            }
          ]
        });
      } else {
        setSimulationProgress(progress);
        if (progress === 20) setSimText('خروج الشاحنة من بوابات الميناء الأمنية وتدقيق بطاقات العبور...');
        if (progress === 40) setSimText('الشاحنة تتحرك على الطريق البري الدولي (سرعة 80 كم/س) - إشارة الـ GPS ممتازة...');
        if (progress === 70) setSimText('المرور بنقطة تفتيش الترانزيت الخارجي ومطابقة أوراق الإفراج الجمركي الموحد...');
        if (progress === 90) setSimText('دخول النطاق اللوجستي لمخازن التاجر الرئيسية والاقتراب من أرصفة التفريغ...');
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* هيدر الشحنة النشطة */}
      <div id="shipment_detail_header" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBackToList}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-medium transition-colors mb-3"
          >
            <ArrowLeft size={14} className="rotate-180" />
            <span>العودة للوحة تحكم الشحنات</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-gray-850">
              {shipment.title}
            </h2>
            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
              {shipment.code}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span>ميناء التخليص: <strong className="text-gray-600">{shipment.portOfDischarge}</strong></span>
            <span>|</span>
            <span>بلد المنشأ: <strong className="text-gray-600">{shipment.countryOfOrigin}</strong></span>
            <span>|</span>
            <span>الشركة الملاحية: <strong className="text-gray-600">{shipment.carrierName}</strong></span>
          </p>
        </div>

        <div className="flex gap-3">
          <div className="text-left md:text-right">
            <span className="text-[10px] text-gray-400 block mb-0.5">المستورد / التاجر</span>
            <strong className="text-xs text-gray-700 block">مؤسسة طه رضوان اللوجستية</strong>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            TR
          </div>
        </div>
      </div>

      {/* الـ 10 خطوات كشريط تقدم وتفاعل علوي */}
      <div id="stepper_container" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs overflow-x-auto">
        <h3 className="text-xs font-bold text-gray-400 mb-4 tracking-wider uppercase">مسار ومراحل دورة التخليص الجمركي ({currentStepIndex + 1} / 10)</h3>
        
        <div className="flex justify-between items-start min-w-[900px] relative">
          {/* خط التوصيل الخلفي */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 -z-0 rounded" />
          {/* خط التقدم الملون الفعلي */}
          <div 
            className="absolute top-4 left-4 h-1 bg-emerald-600 -z-0 rounded transition-all duration-500" 
            style={{ width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 96}%` }}
          />

          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            
            return (
              <div 
                key={step.status} 
                onClick={() => setSelectedStepIndex(idx)}
                className="flex flex-col items-center text-center relative z-10 cursor-pointer group flex-1"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${getStepStatusClass(idx, currentStepIndex)}`}>
                  {isCompleted ? <Check size={14} /> : (idx + 1)}
                </div>
                <span className={`text-[10px] font-bold mt-2.5 transition-colors line-clamp-1 px-1 ${isActive ? 'text-amber-600' : isCompleted ? 'text-emerald-700' : 'text-gray-400 group-hover:text-gray-700'}`}>
                  {step.titleAr}
                </span>
                <span className="text-[8px] text-gray-400 block scale-90 mt-0.5 font-mono">
                  {step.titleEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* لوحة عرض معلومات وتفاصيل الخطوة المختارة والتفاعل معها */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* اللوحة التفاعلية للخطوة الحالية */}
        <div id="interactive_step_panel" className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">الخطوة {selectedStepIndex + 1}</span>
                <h3 className="text-md font-bold text-gray-800">
                  {TIMELINE_STEPS[selectedStepIndex].titleAr}
                </h3>
              </div>
              
              {/* شارة حالة الخطوة المختارة نسبة لخطوة الشحنة */}
              {selectedStepIndex < currentStepIndex ? (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-100 flex items-center gap-1">
                  <ShieldCheck size={12} /> مكتملة ومؤرشفة
                </span>
              ) : selectedStepIndex === currentStepIndex ? (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold border border-amber-100 flex items-center gap-1 animate-pulse">
                  <Activity size={12} /> بانتظار الإجراء
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-bold border border-gray-100">
                  مرحلة مستقبلية
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              {TIMELINE_STEPS[selectedStepIndex].descAr}
            </p>

            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6">
              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <FileCheck className="text-emerald-600" size={14} />
                <span>الشرط الجمركي للانتقال للمرحلة التالية:</span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {TIMELINE_STEPS[selectedStepIndex].checkpointAr}
              </p>
            </div>

            {/* تفاعلات الخطوات التفاعلية الـ 10 الحقيقية (تظهر فقط لو الخطوة المختارة هي الخطوة الحالية للشحنة) */}
            {selectedStepIndex === currentStepIndex ? (
              <div className="border-t border-gray-100 pt-5 mt-5">
                <h4 className="text-xs font-bold text-gray-800 mb-3">نافذة محاكاة العمليات اللوجستية والتخليص الجمركي:</h4>
                
                {/* 1. Purchased */}
                {shipment.currentStatus === 'purchased' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      لقد قمت بشراء البضاعة من المورد <strong className="text-gray-700">{shipment.supplier}</strong> بقيمة إجمالية <strong className="text-gray-800 font-mono">${shipment.valueUSD.toLocaleString()} USD</strong>. لبدء الاستيراد، يتوجب صياغة الفواتير وحجز الحاوية.
                    </p>
                    <button 
                      onClick={() => advanceToStatus('docs_ready', 'تم تأكيد أمر الشراء وتحرير الفاتورة وقوائم التعبئة المبدئية للشحنة بنجاح.')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>تجهيز وإصدار الفواتير وقائمة التعبئة الرسمية</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 2. Docs Ready */}
                {shipment.currentStatus === 'docs_ready' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      الرجاء مراجعة مستندات الشحنة والتحقق من اكتمال أوراق شهادة المنشأ الرسمية الصادرة من دولة {shipment.countryOfOrigin}، وبوليصة الشحن البحرية لضمان سلامة الحاوية.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="border border-emerald-100 bg-emerald-50/20 p-2.5 rounded-lg flex items-center gap-2">
                        <Check className="text-emerald-600 shrink-0" size={14} />
                        <span>الفاتورة وقائمة التعبئة معتمدة</span>
                      </div>
                      <div className="border border-emerald-100 bg-emerald-50/20 p-2.5 rounded-lg flex items-center gap-2">
                        <Check className="text-emerald-600 shrink-0" size={14} />
                        <span>شهادة المنشأ وبوليصة الشحن جاهزة</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => advanceToStatus('arrived_at_port', 'وصلت الباخرة محملة بحاوية البضائع للميناء، وجاري مناولة الحاوية للانتظار وتفريغ السفينة.')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>تأكيد جاهزية الوثائق وطلب استقبال السفينة</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 3. Arrived at port */}
                {shipment.currentStatus === 'arrived_at_port' && (
                  <div className="space-y-4">
                    <div className="border border-blue-100 bg-blue-50/30 p-4 rounded-xl text-xs text-blue-900 flex items-center gap-3">
                      <Anchor className="text-blue-600 shrink-0 animate-bounce" size={24} />
                      <div>
                        <strong>رسو آمن بالميناء:</strong>
                        <p className="text-gray-500 mt-1">البضاعة راسية بميناء التخليص في ساحة المناولة، الرقم التسلسلي للكرين: CRN-9028-A.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => advanceToStatus('declaration_submitted', 'تم إدراج وترقيم المعاملة بالمنصة، وتصنيف بنود التعرفة (HS Code) إلكترونياً.')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>تفريغ الحاوية وتقديم البيان الجمركي إلكترونياً</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 4. Declaration Submitted */}
                {shipment.currentStatus === 'declaration_submitted' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      تم تقديم البيان الجمركي للسلعة وتصنيفها كـ <strong className="text-gray-700">{hsItem.nameAr}</strong> بالترميز الدولي <strong className="font-mono text-emerald-800">{hsItem.code}</strong>. الرسوم الجمركية المقررة هي <strong className="text-gray-800 font-mono">{(hsItem.dutyRate * 100)}%</strong>.
                    </p>

                    <button 
                      onClick={() => advanceToStatus('inspection', 'تم تحويل معاملة الحاوية للمعاينة والتفتيش الجمركي، وتوجيهها للمسار المحدد عبر نظام المخاطر.')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>إرسال المعاملة إلى نظام فرز المخاطر والمعاينة</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 5. Inspection */}
                {shipment.currentStatus === 'inspection' && (
                  <div className="space-y-4">
                    <div className="border border-rose-100 bg-rose-50/20 p-4 rounded-xl text-xs text-gray-700 space-y-3">
                      <div className="flex items-center gap-2 text-rose-700 font-bold">
                        <ShieldAlert size={18} />
                        <span>مسار الفرز الجمركي: المسار {shipment.inspectionChannel === 'red' ? 'الأحمر (تفتيش كامل)' : shipment.inspectionChannel === 'yellow' ? 'الأصفر (فحص مستندات)' : 'الأخضر (تفريغ فوري)'}</span>
                      </div>
                      <p className="text-gray-500">
                        {shipment.inspectionNotes}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setIsXrayDone(true);
                          alert("تم فحص الحاوية بالأشعة السينية: الهيكل الداخلي للحاوية سليم ولا يحتوي على بضائع مخالفة.");
                        }}
                        className={`w-full text-xs font-medium py-2.5 px-4 rounded-xl border transition-all flex items-center justify-between ${isXrayDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Scan size={14} />
                          <span>1. تشغيل واجتياز الفحص بالأشعة السينية (X-Ray Scan)</span>
                        </span>
                        {isXrayDone && <Check size={14} />}
                      </button>

                      <button 
                        onClick={() => {
                          setIsPhysicalDone(true);
                          alert("المعاينة العينية: تم فك القفل ومطابقة نوع البضاعة وعددها مع الكتالوج التجاري، وتبين مطابقتها للبيان الجمركي.");
                        }}
                        disabled={!isXrayDone}
                        className={`w-full text-xs font-medium py-2.5 px-4 rounded-xl border transition-all flex items-center justify-between ${!isXrayDone ? 'opacity-50 cursor-not-allowed' : isPhysicalDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Package size={14} />
                          <span>2. إجراء المعاينة العينية ومطابقة رصاص الختم جمركياً</span>
                        </span>
                        {isPhysicalDone && <Check size={14} />}
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        if (hsItem.requiresSpecialInspection) {
                          advanceToStatus('lab_testing', 'تم تحويل عينة من البضائع للفحص المخبري الإلزامي لدى الهيئة العامة للمواصفات وضبط الجودة.');
                        } else {
                          // تخطي خطوة المختبر لو لم تكن مطلوبة وتحديثها لـ passed تلقائياً
                          onUpdateShipment({
                            ...shipment,
                            labResult: 'passed'
                          });
                          advanceToStatus('payment_pending', 'اجتازت البضاعة الفحص الجمركي، وجاري إصدار المطالبة المالية وسداد الرسوم والضرائب الموحدة.');
                        }
                      }}
                      disabled={!isPhysicalDone}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>توقيع تقرير الفحص والمعاينة</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 6. Lab Testing */}
                {shipment.currentStatus === 'lab_testing' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      نظراً لأن هذه البضائع تندرج تحت المواد الخاضعة لضبط المعايير والرقابة الاستهلاكية، تم توجيهها للمختبر الفني للتحقق من الصلاحية وموافقة المواصفات والمقاييس الوطنية.
                    </p>

                    {!isLabSamplePulled ? (
                      <button 
                        onClick={handleStartLabTest}
                        disabled={isSimulating}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        <FlaskConical size={14} className="animate-pulse" />
                        <span>سحب وإرسال عينات عشوائية إلى مختبر ضبط الجودة</span>
                      </button>
                    ) : (
                      <div className="border border-emerald-100 bg-emerald-50/20 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                        <Check className="text-emerald-600 shrink-0" size={20} />
                        <div>
                          <strong>نتيجة فحص عينات الجودة: سليم ومطابق</strong>
                          <p className="text-gray-500 mt-1">أظهرت النتائج مطابقة الشحنة للمواصفات والتحقق الفني بنسبة 100%. تم تحديث مستند شهادة الجودة.</p>
                        </div>
                      </div>
                    )}

                    {isSimulating && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-2">
                        <span className="text-[10px] text-gray-500 block">{simText}</span>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all duration-150" style={{ width: `${simulationProgress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-blue-600 block">{simulationProgress}%</span>
                      </div>
                    )}

                    <button 
                      onClick={() => advanceToStatus('payment_pending', 'أقر مختبر المواصفات بصلاحية الشحنة، وصدر أمر توجيه الرسوم والضرائب الجمركية الموحدة للمستورد.')}
                      disabled={!isLabSamplePulled || isSimulating}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>توقيع المطابقة وطلب فاتورة الرسوم الموحدة</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 7. Payment Pending */}
                {shipment.currentStatus === 'payment_pending' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      قامت مصلحة الجمارك والموانئ باحتساب الفاتورة الموحدة للرسوم والضرائب. القيمة المطلوبة للدفع الكلي هي:
                    </p>

                    <div className="bg-amber-50/40 border border-amber-200 p-4 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>الرسوم الجمركية ({hsItem.dutyRate * 100}%):</span>
                        <span className="font-mono">{(shipment.valueLocal * hsItem.dutyRate).toLocaleString()} ريال</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>ضريبة القيمة المضافة (15% VAT):</span>
                        <span className="font-mono">{(shipment.valueLocal * 0.15).toLocaleString()} ريال</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>رسوم أرضيات ومناولة الميناء:</span>
                        <span className="font-mono">1,800 ريال</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 font-extrabold border-t border-amber-200 pt-2 text-sm">
                        <span>المجموع المستحق للسداد:</span>
                        <span className="font-mono">{(Math.round(shipment.valueLocal * hsItem.dutyRate) + Math.round(shipment.valueLocal * 0.15) + 1800).toLocaleString()} ريال</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <CreditCard className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="text" 
                          placeholder="أدخل رمز السداد المكون من 6 أرقام..." 
                          value={paymentCode}
                          onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none transition-all font-mono text-left"
                        />
                      </div>
                      <button 
                        onClick={() => setPaymentCode(Math.floor(100000 + Math.random() * 900000).toString())}
                        className="text-[10px] bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-xl transition-colors font-medium"
                      >
                        توليد رمز الدفع
                      </button>
                    </div>

                    <button 
                      onClick={handleProcessPayment}
                      disabled={isPaymentProcessing || !paymentCode}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      {isPaymentProcessing ? (
                        <span>جاري معالجة الدفع والتحقق الجمركي الموحد...</span>
                      ) : (
                        <span>تأكيد سداد الفاتورة الموحدة للجمارك</span>
                      )}
                    </button>
                  </div>
                )}

                {/* 8. Released */}
                {shipment.currentStatus === 'released' && (
                  <div className="space-y-4">
                    <div className="border border-emerald-100 bg-emerald-50/20 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                      <ShieldCheck className="text-emerald-600 shrink-0 animate-bounce" size={24} />
                      <div>
                        <strong>تم الحصول على إذن الفسح والترخيص الجمركي:</strong>
                        <p className="text-gray-500 mt-1">الحاوية جاهزة للخروج والتسليم للناقل البري. تفعيل باركود البوابة الأمنية بالميناء بنجاح.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => advanceToStatus('in_transit', 'تم تحميل الحاوية بنجاح على الشاحنة الناقلة، وفعل قفل الأمن الجغرافي، وتحركت في الترانزيت البري.')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>تحميل الحاوية وبدء النقل والترانزيت البري</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* 9. In Transit */}
                {shipment.currentStatus === 'in_transit' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      الشاحنة الناقلة تتحرك حالياً بالحاوية رقم <span className="font-mono text-gray-700">{shipment.containerNumber}</span> برياً نحو مخازن التاجر. مراقبة الـ GPS نشطة والختم الجمركي آمن.
                    </p>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>مسار الرحلة: ميناء الشحن ← مستودعات التاجر</span>
                        <span className="font-mono font-bold text-emerald-600">{transitPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${transitPercent}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 block text-center font-medium italic">{simText || 'الشاحنة جاهزة للانطلاق'}</span>
                    </div>

                    {transitPercent < 100 ? (
                      <button 
                        onClick={handleStartTransit}
                        disabled={isSimulating}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        <Truck size={14} />
                        <span>تتبع وتشغيل حركة الشاحنة (محاكاة حية للرحلة)</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => advanceToStatus('delivered', 'وصلت الحاوية بسلام إلى مستودعات التاجر، جاري فك الختم وبدء جرد البضائع وتفريغها.')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        <span>تأكيد استلام الحاوية والبدء في تفريغ المخازن</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* 10. Delivered */}
                {shipment.currentStatus === 'delivered' && (
                  <div className="space-y-4">
                    <div className="border border-emerald-100 bg-emerald-50/20 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                      <Building className="text-emerald-600 shrink-0" size={24} />
                      <div>
                        <strong>وصلت الشحنة ومؤرشفة بالمستودع:</strong>
                        <p className="text-gray-500 mt-1">لقد تم تفريغ الحاوية بنجاح ومطابقة كافة المحتويات وإغلاق دورة التخليص الجمركي بسلام.</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <button 
                        onClick={() => {
                          setIsSealCut(true);
                          alert("تم قطع الختم الجمركي الفولاذي رقم SEAL-90281-B بنجاح وتوثيق ذلك بتقرير الاستلام.");
                        }}
                        className={`w-full text-xs font-medium py-2.5 px-4 rounded-xl border transition-all flex items-center justify-between ${isSealCut ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Unlock size={14} />
                          <span>1. قطع الختم الجمركي وفك إقفال الحاوية</span>
                        </span>
                        {isSealCut && <Check size={14} />}
                      </button>

                      <button 
                        onClick={() => {
                          setIsInventoryMatched(true);
                          alert("مطابقة الجرد: تبين تطابق كمية الصناديق والمقاسات بالكامل مع الفاتورة المعتمدة وقائمة التعبئة.");
                        }}
                        disabled={!isSealCut}
                        className={`w-full text-xs font-medium py-2.5 px-4 rounded-xl border transition-all flex items-center justify-between ${!isSealCut ? 'opacity-50 cursor-not-allowed' : isInventoryMatched ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="flex items-center gap-1.5">
                          <FileCheck size={14} />
                          <span>2. مطابقة الجرد وجرد الكميات مع قائمة التعبئة</span>
                        </span>
                        {isInventoryMatched && <Check size={14} />}
                      </button>
                    </div>

                    {isInventoryMatched && (
                      <div className="p-3 bg-emerald-500 text-white rounded-xl text-center text-xs font-bold shadow-xs">
                        🎉 اكتملت دورة التخليص والخدمات اللوجستية بنجاح بنسبة 100%!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-5 mt-5 text-center text-xs text-gray-400">
                <span>يرجى اختيار خطوة الشحنة النشطة الحالية (الخطوة رقم {currentStepIndex + 1}) لتشغيل عمليات المحاكاة والتخليص التفاعلية المباشرة.</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
            <button 
              onClick={() => setSelectedStepIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedStepIndex === 0}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-700 disabled:opacity-50 transition-colors font-semibold"
            >
              <ArrowLeft size={14} />
              <span>الخطوة السابقة</span>
            </button>
            <span className="text-xs text-gray-400 font-mono">الخطوة {selectedStepIndex + 1} من 10</span>
            <button 
              onClick={() => setSelectedStepIndex(prev => Math.min(TIMELINE_STEPS.length - 1, prev + 1))}
              disabled={selectedStepIndex === TIMELINE_STEPS.length - 1}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-700 disabled:opacity-50 transition-colors font-semibold"
            >
              <span>الخطوة التالية</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* كرت تتبع الجغرافيا التاريخية وحالة المستندات */}
        <div id="shipment_tracking_history" className="lg:col-span-5 space-y-6">
          {/* كرت السجلات اللوجستية وتاريخ الأحداث */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h4 className="text-xs font-extrabold text-gray-400 mb-4 tracking-wider uppercase flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-600" />
              <span>سجل الحركات الجمركية والأحداث للرحلة</span>
            </h4>
            
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {shipment.logs.slice().reverse().map((log, idx) => (
                <div key={log.id} className="flex gap-3 relative group">
                  {idx !== shipment.logs.length - 1 && (
                    <div className="absolute top-5 bottom-0 right-3.5 w-0.5 bg-gray-100 group-hover:bg-emerald-100 transition-colors" />
                  )}
                  
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border text-[10px] ${log.userAction ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    {log.userAction ? 'TR' : 'SYS'}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      {log.message}
                    </p>
                    <span className="text-[9px] text-gray-400 font-mono block">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* خريطة تفاعلية مصغرة للرحلة لوجستياً */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h4 className="text-xs font-extrabold text-gray-400 mb-3 tracking-wider uppercase flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-600" />
              <span>المراقبة الجغرافية لمسار الشحنة</span>
            </h4>

            {/* تمثيل تفاعلي لخط السير الجغرافي */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span className="flex items-center gap-1">🚢 دولة المصدر ({shipment.countryOfOrigin})</span>
                <span className="flex items-center gap-1">🏢 مستودعات التاجر</span>
              </div>

              <div className="relative h-12 flex items-center justify-between px-2">
                <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
                <div 
                  className="absolute left-0 h-1.5 bg-emerald-600 rounded-full transition-all duration-500" 
                  style={{ width: `${currentStepIndex >= 8 ? 100 : currentStepIndex >= 2 ? 50 : 10}%` }}
                />

                {/* نقاط العبور */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold ${currentStepIndex >= 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                    1
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 font-bold">شراء</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold ${currentStepIndex >= 2 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                    2
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 font-bold">الميناء</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold ${currentStepIndex >= 7 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                    3
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 font-bold">الفسح</span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold ${currentStepIndex === 9 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                    4
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 font-bold">المخازن</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400">
                {currentStepIndex === 9 ? (
                  <span className="text-emerald-700 font-bold">🎉 تم تسليم الحاوية وفك الختم بمخازن التاجر</span>
                ) : currentStepIndex >= 8 ? (
                  <span className="text-blue-600 font-bold">🚚 الحاوية على الشاحنة قيد الترانزيت البري الآن</span>
                ) : currentStepIndex >= 2 ? (
                  <span className="text-amber-600 font-bold">⚓ الحاوية راسية بميناء التخليص قيد الإجراءات الجمركية</span>
                ) : (
                  <span className="text-gray-500">🚢 جاري تجهيز الأوراق والوثائق وبدء النقل البحري الدولي</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* مدير وثائق الشحنة النشط لسهولة المراجعة والاطلاع */}
      <DocumentManager shipment={shipment} />
    </div>
  );
}
