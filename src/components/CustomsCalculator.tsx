/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Scale, 
  HelpCircle, 
  ArrowRightLeft, 
  Percent, 
  Info,
  ShieldCheck
} from 'lucide-react';

interface CustomsCalculatorProps {
  onClose?: () => void;
}

export default function CustomsCalculator({ onClose }: CustomsCalculatorProps) {
  const [cargoValue, setCargoValue] = useState<number>(15000);
  const [cargoType, setCargoType] = useState<string>('electronics');
  const [shippingMode, setShippingMode] = useState<string>('sea');
  const [quantity, setQuantity] = useState<number>(1);
  const [regionRate, setRegionRate] = useState<'aden' | 'sanaa'>('aden');

  // أسعار الصرف الجمركي الرسمي لليمن
  const exchangeRate = regionRate === 'aden' ? 250 : 530; // سعر الصرف الجمركي الرسمي المعدل

  // لوائح ومعدلات التعريفة الجمركية والضرائب في اليمن
  const customsRules = useMemo(() => {
    switch (cargoType) {
      case 'electronics':
        return {
          name: 'أجهزة إلكترونية وتكنولوجيا',
          dutyRate: 15,
          vatRate: 5,
          otherTaxRate: 3,
          description: 'تخضع لمعاينة المطابقة والمواصفات للتأكد من سلامة المعايير الفنية.'
        };
      case 'food':
        return {
          name: 'مواد غذائية أساسية وحبوب',
          dutyRate: 5,
          vatRate: 2,
          otherTaxRate: 1,
          description: 'تخضع للفحص المخبري الإلزامي من هيئة المقاييس وضبط الجودة والفسح السريع لمنع التلف.'
        };
      case 'clothes':
        return {
          name: 'ملابس ومنسوجات جاهزة',
          dutyRate: 20,
          vatRate: 5,
          otherTaxRate: 4,
          description: 'تطبق عليها تعريفة الاستهلاك العادي مع تدقيق بلد المنشأ والبيان الجمركي.'
        };
      case 'industrial':
        return {
          name: 'معدات وخطوط إنتاج صناعية',
          dutyRate: 5,
          vatRate: 5,
          otherTaxRate: 1.5,
          description: 'تحظى بتسهيلات تشجيعية لدعم الإنتاج المحلي والمشاريع الاستثمارية.'
        };
      case 'cars':
        return {
          name: 'سيارات ومركبات نقل ومعدات ثقيلة',
          dutyRate: 25,
          vatRate: 5,
          otherTaxRate: 5,
          description: 'تخضع لاحتساب الرسوم وفق سنة الصنع وسعة المحرك والوزن الإجمالي.'
        };
      case 'medical':
        return {
          name: 'أدوية ومستلزمات طبية ومعقمات',
          dutyRate: 0, // معفي جمركياً لدعم القطاع الصحي
          vatRate: 0,
          otherTaxRate: 1,
          description: 'بضائع معفاة من الرسوم الجمركية وضريبة القيمة المضافة بموجب لوائح وزارة الصحة العامة.'
        };
      case 'chemicals':
        return {
          name: 'مواد كيميائية وبلاستيك وخامات أولية',
          dutyRate: 10,
          vatRate: 5,
          otherTaxRate: 2,
          description: 'تطلب تراخيص مسبقة من الجهات ذات العلاقة وتدقيق الفرز والتخزين الآمن.'
        };
      case 'building':
        return {
          name: 'مواد بناء وحديد وأخشاب',
          dutyRate: 12,
          vatRate: 5,
          otherTaxRate: 3,
          description: 'رسوم معيارية مطبقة لدعم استقرار البناء والتنمية الحضرية.'
        };
      default:
        return {
          name: 'بضائع عامة وتجهيزات',
          dutyRate: 10,
          vatRate: 5,
          otherTaxRate: 2,
          description: 'تعريفة جمركية عامة للشحنات والسلع التي لم تدرج تحت بنود تخصصية أخرى.'
        };
    }
  }, [cargoType]);

  // رسوم النقل والمناولة المضافة بناء على نوع منفذ التفريغ وعدد الشحنات
  const shippingFees = useMemo(() => {
    switch (shippingMode) {
      case 'sea':
        return {
          name: 'شحن بحري - حاوية كاملة (FCL)',
          portFeesUSD: 450 * quantity,
          insuranceRate: 1.2, // 1.2% من القيمة الكلية
          handlingFeesUSD: 150
        };
      case 'air':
        return {
          name: 'شحن جوي - شحنة مستعجلة',
          portFeesUSD: 350 * quantity,
          insuranceRate: 2.0, // تأمين جوي أعلى
          handlingFeesUSD: 100
        };
      case 'land':
        return {
          name: 'شحن بري - قوافل ومقطورات برية',
          portFeesUSD: 250 * quantity,
          insuranceRate: 0.8,
          handlingFeesUSD: 80
        };
      default:
        return {
          name: 'خدمات تخليص عامة',
          portFeesUSD: 150 * quantity,
          insuranceRate: 1.0,
          handlingFeesUSD: 50
        };
    }
  }, [shippingMode, quantity]);

  // الحسابات التفصيلية للرسوم والضرائب
  const calculations = useMemo(() => {
    const value = Math.max(0, cargoValue);
    
    // الرسوم الجمركية الأساسية = القيمة × نسبة التعريفة
    const customDutyUSD = (value * customsRules.dutyRate) / 100;
    
    // القيمة الخاضعة للضريبة = القيمة الأساسية + الرسوم الجمركية + التأمين المقدر
    const insuranceUSD = (value * shippingFees.insuranceRate) / 100;
    const taxableBaseUSD = value + customDutyUSD + insuranceUSD;
    
    // ضريبة القيمة المضافة (VAT)
    const vatUSD = (taxableBaseUSD * customsRules.vatRate) / 100;
    
    // ضرائب ورسوم أخرى (أرباح تجارية، رسوم إعمار، إلخ)
    const otherTaxesUSD = (value * customsRules.otherTaxRate) / 100;
    
    // الرسوم المينائية ومصاريف المناولة
    const localPortFeesUSD = shippingFees.portFeesUSD + shippingFees.handlingFeesUSD;
    
    // الإجماليات
    const totalCustomsDuesUSD = customDutyUSD + vatUSD + otherTaxesUSD + localPortFeesUSD;
    const grandTotalUSD = value + totalCustomsDuesUSD;

    // التحويل للريال اليمني
    const customDutyYER = customDutyUSD * exchangeRate;
    const vatYER = vatUSD * exchangeRate;
    const otherTaxesYER = otherTaxesUSD * exchangeRate;
    const localPortFeesYER = localPortFeesUSD * exchangeRate;
    const totalCustomsDuesYER = totalCustomsDuesUSD * exchangeRate;
    const grandTotalYER = grandTotalUSD * exchangeRate;

    // نسبة الرسوم إلى قيمة البضاعة الأساسية
    const duesPercentage = value > 0 ? (totalCustomsDuesUSD / value) * 100 : 0;

    return {
      customDutyUSD,
      customDutyYER,
      insuranceUSD,
      vatUSD,
      vatYER,
      otherTaxesUSD,
      otherTaxesYER,
      localPortFeesUSD,
      localPortFeesYER,
      totalCustomsDuesUSD,
      totalCustomsDuesYER,
      grandTotalUSD,
      grandTotalYER,
      duesPercentage
    };
  }, [cargoValue, customsRules, shippingFees, exchangeRate]);

  return (
    <div id="customs_calculator_container" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-right font-sans">
      
      {/* هيدر الحاسبة الراقية */}
      <div className="flex items-center justify-between mb-6">
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-800">حاسبة الرسوم الجمركية اليمنية التقديرية</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">مبنية على قوانين مصلحة الجمارك اليمنية العامة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* قسم إدخال البيانات (الجانب الأيمن) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* قيمة السلعة */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 block">قيمة البضاعة المصرح بها (USD):</label>
            <div className="relative">
              <input 
                type="number" 
                value={cargoValue}
                onChange={(e) => setCargoValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs font-semibold px-3 py-2.5 pl-10 bg-gray-55/60 border border-gray-200 rounded-xl text-gray-800 outline-none focus:border-emerald-500 text-left font-mono"
                placeholder="أدخل قيمة الفاتورة بالدولار..."
              />
              <span className="absolute left-3.5 top-2.5 text-xs text-gray-400 font-bold">$</span>
            </div>
          </div>

          {/* نوع البضاعة والسلعة جمركياً */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 block">تصنيف السلعة ونوع البضائع:</label>
            <select
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-gray-55/60 border border-gray-200 rounded-xl text-gray-800 outline-none focus:border-emerald-500 font-medium"
            >
              <option value="electronics">📱 أجهزة إلكترونية وتكنولوجيا (الرسوم 15%)</option>
              <option value="food">🍎 مواد غذائية أساسية وحبوب (الرسوم 5%)</option>
              <option value="clothes">👕 ملابس ومنسوجات جاهزة (الرسوم 20%)</option>
              <option value="industrial">⚙️ معدات وخطوط إنتاج صناعية (الرسوم 5%)</option>
              <option value="cars">🚗 سيارات ومركبات ومعدات ثقيلة (الرسوم 25%)</option>
              <option value="medical">💊 أدوية ومستلزمات طبية ومعقمات (معفي جمركياً)</option>
              <option value="chemicals">🧪 مواد كيميائية وبلاستيك وخامات أولية (الرسوم 10%)</option>
              <option value="building">🧱 مواد بناء وحديد وأخشاب (الرسوم 12%)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* وسيلة الشحن والنقل */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">طريقة الشحن / المنفذ:</label>
              <select
                value={shippingMode}
                onChange={(e) => setShippingMode(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-gray-55/60 border border-gray-200 rounded-xl text-gray-800 outline-none focus:border-emerald-500 font-medium"
              >
                <option value="sea">🚢 شحن بحري (ميناء)</option>
                <option value="air">✈️ شحن جوي (مطار)</option>
                <option value="land">🚚 شحن بري (منفذ)</option>
              </select>
            </div>

            {/* عدد الوحدات / الحاويات */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 block">عدد الحاويات / الطرود:</label>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-55/60 border border-gray-200 rounded-xl text-gray-800 outline-none focus:border-emerald-500 font-mono text-center"
                min={1}
              />
            </div>
          </div>

          {/* سعر الصرف الجمركي المعتمد */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 block">تسعير الريال اليمني الجمركي الرسمي:</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setRegionRate('aden')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${regionRate === 'aden' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                سعر جمركي عدن والمحافظات الجنوبية (250 ريال)
              </button>
              <button
                type="button"
                onClick={() => setRegionRate('sanaa')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${regionRate === 'sanaa' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                سعر جمركي صنعاء والمحافظات الشمالية (530 ريال)
              </button>
            </div>
          </div>

          {/* معلومات إضافية بناء على السلعة */}
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-2">
            <Info size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-gray-800">تنبيهات مصلحة الجمارك:</span>
              <p className="text-[9px] text-gray-500 leading-relaxed">{customsRules.description}</p>
            </div>
          </div>

        </div>

        {/* النتائج وتفاصيل الاحتساب الجمركي (الجانب الأيسر) */}
        <div className="lg:col-span-7 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] bg-slate-800 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full border border-slate-700">
                تقدير لوجستي موثوق
              </span>
              <div className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-300">مكتب طه رضوان للخدمات اللوجستية</span>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* المجموع الجمركي الكلي */}
            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي الرسوم الجمركية والضرائب المتوقعة:</span>
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-wide" style={{ direction: 'ltr' }}>
                $ {calculations.totalCustomsDuesUSD.toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </div>
              <div className="text-xs text-slate-400 font-semibold font-mono">
                ≈ {calculations.totalCustomsDuesYER.toLocaleString('en-US', { maximumFractionDigits: 0 })} ريال يمني
              </div>
              <div className="text-[9px] text-slate-500 font-semibold pt-1">
                تمثل الرسوم والمصروفات المضافة نسبة <span className="text-emerald-400 font-bold font-mono">{calculations.duesPercentage.toFixed(1)}%</span> من القيمة الكلية للبضاعة.
              </div>
            </div>

            {/* تفاصيل التجزئة الجمركية */}
            <div className="space-y-2.5 text-xs">
              
              {/* الرسم الجمركي الأساسي */}
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>الرسوم الجمركية الأساسية ({customsRules.dutyRate}%)</span>
                </div>
                <div className="font-mono font-bold text-white text-left" style={{ direction: 'ltr' }}>
                  $ {calculations.customDutyUSD.toLocaleString()}
                  <span className="text-[9px] text-slate-400 block font-normal">{calculations.customDutyYER.toLocaleString(undefined, {maximumFractionDigits: 0})} ريال</span>
                </div>
              </div>

              {/* ضريبة القيمة المضافة */}
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>ضريبة القيمة المضافة الموحدة (VAT {customsRules.vatRate}%)</span>
                </div>
                <div className="font-mono font-bold text-white text-left" style={{ direction: 'ltr' }}>
                  $ {calculations.vatUSD.toLocaleString()}
                  <span className="text-[9px] text-slate-400 block font-normal">{calculations.vatYER.toLocaleString(undefined, {maximumFractionDigits: 0})} ريال</span>
                </div>
              </div>

              {/* الضرائب المرافقة الأخرى */}
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>الأرباح والرسوم المرافقة للتنمية ({customsRules.otherTaxRate}%)</span>
                </div>
                <div className="font-mono font-bold text-white text-left" style={{ direction: 'ltr' }}>
                  $ {calculations.otherTaxesUSD.toLocaleString()}
                  <span className="text-[9px] text-slate-400 block font-normal">{calculations.otherTaxesYER.toLocaleString(undefined, {maximumFractionDigits: 0})} ريال</span>
                </div>
              </div>

              {/* رسوم المناولة والمنفذ المضاف */}
              <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>رسوم أرضيات ومناولة الميناء والمنفذ والخدمات</span>
                </div>
                <div className="font-mono font-bold text-white text-left" style={{ direction: 'ltr' }}>
                  $ {calculations.localPortFeesUSD.toLocaleString()}
                  <span className="text-[9px] text-slate-400 block font-normal">{calculations.localPortFeesYER.toLocaleString(undefined, {maximumFractionDigits: 0})} ريال</span>
                </div>
              </div>

            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300">سعر الصرف الجمركي المعتمد:</span>
              <span className="font-mono">1 USD = {exchangeRate} YER</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300">المجموع الكلي مع الرسوم بالدولار:</span>
              <span className="font-mono font-bold text-white" style={{ direction: 'ltr' }}>
                $ {calculations.grandTotalUSD.toLocaleString(undefined, {maximumFractionDigits: 1})}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
