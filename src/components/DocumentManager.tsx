/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Document, Shipment } from '../types';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Printer, 
  Download, 
  ShieldCheck, 
  X,
  FileCheck2,
  Building2,
  Calendar,
  Anchor
} from 'lucide-react';

interface DocumentManagerProps {
  shipment: Shipment;
  onUpdateDocument?: (docId: string, updatedDoc: Document) => void;
}

export default function DocumentManager({ shipment, onUpdateDocument }: DocumentManagerProps) {
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle size={12} />
            <span>مكتمل ومعتمد</span>
          </span>
        );
      case 'draft':
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <Clock size={12} />
            <span>مسودة / قيد المراجعة</span>
          </span>
        );
      case 'missing':
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-100">
            <AlertCircle size={12} />
            <span>غير متوفر</span>
          </span>
        );
    }
  };

  const getDocIcon = (type: Document['type']) => {
    switch (type) {
      case 'invoice': return '🧾';
      case 'packing_list': return '📦';
      case 'origin': return '🌍';
      case 'quality': return '🔬';
      case 'lading': return '⚓';
      case 'declaration': return '📜';
      case 'release': return '🔑';
      default: return '📄';
    }
  };

  const simulatePrint = () => {
    alert("محاكاة: تم إرسال الوثيقة الجمركية لطابعة المستندات الآمنة بنجاح.");
  };

  return (
    <div id="document_manager_container" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
        <div>
          <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-emerald-600" size={18} />
            <span>مجلد الوثائق والمستندات الرسمية ({shipment.documents.filter(d => d.status === 'completed').length}/{shipment.documents.length})</span>
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            الوثائق المطلوبة للمطابقة وتخليص الحاوية رقم: <span className="font-mono text-gray-600">{shipment.containerNumber}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {shipment.documents.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => setActiveDoc(doc)}
            className="group cursor-pointer border border-gray-100 rounded-xl p-4 hover:border-emerald-300 hover:shadow-xs hover:bg-emerald-50/10 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-gray-50 group-hover:bg-emerald-50 rounded-xl transition-all">
                  {getDocIcon(doc.type)}
                </span>
                <div>
                  <h5 className="text-xs font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {doc.title}
                  </h5>
                  <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                    رقم: {doc.fileNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <span className="text-[10px] text-gray-400">جهة المصدر: {doc.issuer}</span>
              {getStatusBadge(doc.status)}
            </div>
          </div>
        ))}
      </div>

      {/* مودال معاينة الوثيقة بالتفصيل */}
      {activeDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
            {/* هيدر المودال */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getDocIcon(activeDoc.type)}</span>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{activeDoc.title}</h4>
                  <p className="text-[10px] text-gray-400 font-mono">الرقم المرجعي: {activeDoc.fileNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveDoc(null)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* محتوى الوثيقة - مظهر ورقة حقيقية */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-100/50 flex justify-center">
              <div className="bg-white w-full border border-gray-200 shadow-md p-8 font-sans text-right relative min-h-[500px] border-t-4 border-t-emerald-600 rounded-xs">
                {/* خلفية مائية للرمز الجمركي */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <ShieldCheck size={350} className="text-emerald-900" />
                </div>

                {/* ترويسة ورقة رسمية */}
                <div className="flex justify-between items-start border-b-2 border-gray-200 pb-5 mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">{activeDoc.issuer}</h3>
                    <p className="text-xs text-gray-400 mt-1">مستند رسمي معتمد</p>
                    <p className="text-xs text-gray-400">تاريخ الإصدار: {activeDoc.issueDate}</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        سند مبرم
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono block mt-1">كود المتابعة: SEC-{shipment.code}</span>
                  </div>
                </div>

                {/* محتويات ديناميكية بناءً على نوع الوثيقة */}
                {activeDoc.type === 'invoice' && (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-1">المصدر / البائع:</span>
                        <strong className="text-gray-700">{shipment.supplier}</strong>
                        <span className="text-gray-500 block">{shipment.countryOfOrigin}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">المستورد / المشتري:</span>
                        <strong className="text-gray-700">مؤسسة التاجر للخدمات اللوجستية</strong>
                        <span className="text-gray-500 block">منطقة المخازن المركزية</span>
                      </div>
                    </div>

                    <h5 className="text-xs font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">تفاصيل البضاعة المصدرة:</h5>
                    <table className="w-full text-xs text-right border-collapse mb-6">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                          <th className="py-2 px-1">البند التجاري</th>
                          <th className="py-2 px-1 text-center">الكمية</th>
                          <th className="py-2 px-1 text-left">سعر الوحدة</th>
                          <th className="py-2 px-1 text-left">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDoc.content.items?.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 text-gray-700">
                            <td className="py-3 px-1 font-medium">{item.name}</td>
                            <td className="py-3 px-1 text-center font-mono">{item.qty} وحدة</td>
                            <td className="py-3 px-1 text-left font-mono">${item.unitPrice.toLocaleString()}</td>
                            <td className="py-3 px-1 text-left font-bold font-mono text-emerald-700">${item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end text-xs">
                      <div className="w-1/2 border-t border-gray-200 pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">القيمة الصافية:</span>
                          <strong className="font-mono">${activeDoc.content.invoiceValue?.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">طريقة الشحن المتفق عليها:</span>
                          <strong className="text-gray-600">CIF (شامل التأمين والشحن للميناء)</strong>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-sm text-emerald-800 font-bold">
                          <span>القيمة الكلية للفاتورة:</span>
                          <span className="font-mono">${activeDoc.content.invoiceValue?.toLocaleString()} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDoc.type === 'packing_list' && (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-1">المصدر:</span>
                        <strong className="text-gray-700">{shipment.supplier}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">ميناء التفريغ النهائي:</span>
                        <strong className="text-gray-700">{shipment.portOfDischarge}</strong>
                      </div>
                    </div>

                    <h5 className="text-xs font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">تفاصيل أوزان ومقاسات الشحنة:</h5>
                    <div className="space-y-3 text-xs text-gray-700">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">الوزن الإجمالي الصافي (Net Weight):</span>
                        <strong className="font-mono">{activeDoc.content.totalWeight} طن متري</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">إجمالي عدد الحاويات (Container Count):</span>
                        <strong className="font-mono">{activeDoc.content.containerCount} حاوية جافة</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">أرقام الحاويات المدرجة (Container Numbers):</span>
                        <span className="font-mono bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                          {activeDoc.content.containerNumbers?.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDoc.type === 'origin' && (
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
                      <Building2 size={30} />
                    </div>
                    <h4 className="text-sm font-extrabold text-gray-800 mb-2">شهادة إثبات وتوثيق المنشأ</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed mb-6">
                      تشهد الغرفة التجارية المبرمة أدناه، وبعد فحص سجلات التصنيع والإنتاج، بأن كافة البضائع والمنتجات الموصوفة في الفاتورة التجارية رقم <span className="font-mono text-gray-700">{shipment.code}</span> قد تم إنتاجها وتصنيعها بالكامل في دولة المنشأ المصرح بها.
                    </p>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-xs text-right border border-gray-100 p-4 rounded-xl bg-gray-50/50">
                      <div>
                        <span className="text-gray-400 block mb-0.5">بلد المنشأ المعتمد:</span>
                        <strong className="text-gray-700 text-sm">{activeDoc.content.originCountry}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">رقم الشهادة الرسمي:</span>
                        <strong className="text-gray-700 font-mono text-sm">{activeDoc.content.certificateNumber}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {activeDoc.type === 'quality' && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      <FileCheck2 className="text-emerald-600 shrink-0" size={18} />
                      <span>شهادة اختبار معتمدة لمطابقة الجودة وخلو البضاعة من أي عيوب تصنيعية أو شوائب ضارة.</span>
                    </div>

                    <div className="space-y-3 text-xs text-gray-700">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">مختبر الاعتماد والفحص:</span>
                        <strong>SGS Global Laboratories Group</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">ملخص نتائج التحليل الفيزيائي والتقني:</span>
                        <strong className="text-emerald-700">سليمة ومطابقة للمعايير القياسية تماماً (Passed)</strong>
                      </div>
                      <div className="py-2">
                        <span className="text-gray-400 block mb-1">ملاحظات هيئة الرقابة والمطابقة:</span>
                        <p className="bg-gray-50 text-gray-600 p-3 rounded-lg border border-gray-200 leading-relaxed font-mono text-[11px]">
                          {activeDoc.content.labNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDoc.type === 'lading' && (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-1">الناقل الملاحي:</span>
                        <strong className="text-gray-700">{shipment.carrierName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">ميناء التحميل (Loading Port):</span>
                        <strong className="text-gray-700">ميناء التصدير الرئيسي بدولة المنشأ</strong>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs text-gray-700 mb-6">
                      <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 p-2 font-bold">
                        <div>ميناء التفريغ</div>
                        <div>رقم الحاوية</div>
                        <div className="text-left">نوع الشحن</div>
                      </div>
                      <div className="grid grid-cols-3 p-2 font-mono text-[11px] items-center">
                        <div className="font-sans font-medium">{shipment.portOfDischarge}</div>
                        <div>{activeDoc.content.containerNumbers?.join(', ')}</div>
                        <div className="text-left font-sans">بحرى - حاوية كاملة (FCL)</div>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      * تقر بوليصة الشحن هذه بأن الشحنة الموصوفة قد تم تحميلها على متن السفينة بحالة ظاهرية ممتازة وملتزمة بقواعد النقل الملاحي البحري الدولي، ويتم تسليمها للجهة المستفيدة المذكورة عند تقديم البوليصة وسداد رسوم المناولة.
                    </p>
                  </div>
                )}

                {activeDoc.type === 'declaration' && (
                  <div>
                    <div className="bg-amber-50 text-amber-900 border border-amber-100 p-3 rounded-lg text-xs mb-4 flex items-center gap-2">
                      <ShieldCheck size={16} />
                      <span>تم احتساب القيمة الجمركية الخاضعة للضريبة بناءً على بند التعريفة ومصادقتها في النظام.</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-gray-700">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">بند التعريفة والترميز الجمركي (HS Code):</span>
                        <strong className="font-mono text-gray-800 text-[13px]">{activeDoc.content.hsCode}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">قيمة الشحنة المقبولة جمركياً:</span>
                        <strong className="font-mono text-gray-800">{(shipment.valueLocal).toLocaleString()} ريال / عملة محلية</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">الرسوم الجمركية الأساسية ({shipment.dutyRate ? `${shipment.dutyRate * 100}%` : '0%'}):</span>
                        <strong className="font-mono text-gray-800">{(activeDoc.content.dutiesAmount || 0).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">ضريبة القيمة المضافة المقررة (15% VAT):</span>
                        <strong className="font-mono text-gray-800">{(activeDoc.content.vatAmount || 0).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400">رسوم الميناء والمناولة والخدمات الإضافية:</span>
                        <strong className="font-mono text-gray-800">{(activeDoc.content.portFees || 0).toLocaleString()}</strong>
                      </div>

                      <div className="flex justify-between py-2 border-t border-gray-300 font-extrabold text-sm text-emerald-800 bg-emerald-50/50 px-2 rounded mt-2">
                        <span>مجموع المطالبة المالية الموحدة:</span>
                        <span className="font-mono">
                          {((activeDoc.content.dutiesAmount || 0) + (activeDoc.content.vatAmount || 0) + (activeDoc.content.portFees || 0)).toLocaleString()} ريال / عملة محلية
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDoc.type === 'release' && (
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 border border-emerald-100 animate-pulse">
                      <Anchor size={30} />
                    </div>
                    <h4 className="text-sm font-extrabold text-emerald-800 mb-2">أمر الفسح الجمركي النهائي والتخليص</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed mb-4">
                      بعد فحص المستندات، واستيفاء المعاينة الجمركية واجتياز فحوصات الهيئة العامة للمواصفات والمقاييس، وسداد كافة المطالبات المالية، يُرخص بموجبه بخروج الشحنة والحاوية رقم <span className="font-mono font-bold text-gray-700">{shipment.containerNumber}</span> من بوابات الميناء الأمنية.
                    </p>

                    <div className="border-2 border-dashed border-emerald-200 p-4 rounded-xl bg-emerald-50/20 max-w-xs mx-auto space-y-1">
                      <span className="text-[10px] text-gray-400 block font-sans">باركود الفسح الإلكتروني الموحد:</span>
                      <div className="w-full h-8 bg-gray-800 text-white flex items-center justify-center text-[10px] font-mono tracking-[4px] rounded select-none">
                        ||||| | ||||| | ||| {shipment.code} |||||
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block pt-1">حالة البوابات: مصرح بالخروج (Gate Pass Active)</span>
                    </div>
                  </div>
                )}

                {/* ختم التخليص الرسمي الموحد */}
                <div className="mt-8 pt-5 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>تم التحقق إلكترونياً وصادر عن مصلحة الجمارك</span>
                  </div>
                  <div className="relative text-left">
                    {/* ختم دائري باللون الأحمر/الأزرق الجمركي */}
                    <div className="border-4 border-double border-blue-600/60 rounded-full p-2 w-16 h-16 flex flex-col items-center justify-center text-[8px] font-bold text-blue-600/80 rotate-12 select-none mx-auto">
                      <span>الجمارك العامة</span>
                      <span className="border-t border-b border-blue-600/40 my-0.5 px-1">مُعتمد</span>
                      <span>تخليص آمن</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* فوتر المودال - الإجراءات */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={14} />
                <span>شحنة رقم: {shipment.code}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={simulatePrint}
                  className="flex items-center gap-1.5 text-xs bg-white text-gray-700 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Printer size={14} />
                  <span>طباعة المستند</span>
                </button>
                <button 
                  onClick={() => alert("محاكاة: تم تنزيل الملف بصيغة PDF المؤرشفة جمركياً.")}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition-colors font-medium shadow-xs"
                >
                  <Download size={14} />
                  <span>تنزيل نسخة PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
