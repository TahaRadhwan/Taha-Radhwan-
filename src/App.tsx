/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from 'react';
import { Shipment, Document, AppNotification, AlertConfig } from './types';
import { INITIAL_SHIPMENTS } from './data';
import { db, auth, isFirebaseEnabled, OperationType, handleFirestoreError } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import DashboardStats from './components/DashboardStats';
import ShipmentList from './components/ShipmentList';
import ActiveShipmentDetails from './components/ActiveShipmentDetails';
import CustomsGuide from './components/CustomsGuide';
import TrackingMap from './components/TrackingMap';
import DigitalDocumentCenter from './components/DigitalDocumentCenter';
import AlertSettings from './components/AlertSettings';
import GoogleWorkspacePanel from './components/GoogleWorkspacePanel';
import CustomsCalculator from './components/CustomsCalculator';
import CostAnalysisChart from './components/CostAnalysisChart';
import { setWorkspaceToken } from './lib/workspace';
import { 
  Building2, 
  BookOpen, 
  Package, 
  RefreshCw,
  Layers,
  GraduationCap,
  MapPin,
  FolderClosed,
  BellRing,
  Globe
} from 'lucide-react';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    shipmentId: 'ship_solar_systems',
    shipmentCode: 'YE-90214',
    title: 'تجهيز بوليصة الشحن بنجاح',
    message: 'تم ربط بوليصة الشحن البحرية (Bill of Lading) وحجز الحاوية لشحنة منظومات الطاقة الشمسية المتجهة لميناء عدن.',
    type: 'success',
    timestamp: '2026-07-17 11:30',
    isRead: false,
    category: 'docs'
  },
  {
    id: 'notif_2',
    shipmentId: 'ship_wheat_grain',
    shipmentCode: 'YE-80921',
    title: 'تأخير متوقع بسبب حالة الطقس',
    message: 'عاصفة بحرية خفيفة تؤثر على سرعة إبحار ناقلة القمح الروسي بمقتربات باب المندب، قد يترتب عليها تأخير يومين.',
    type: 'warning',
    timestamp: '2026-07-17 09:15',
    isRead: false,
    category: 'delay'
  },
  {
    id: 'notif_3',
    shipmentId: 'ship_honey_export',
    shipmentCode: 'YE-71049',
    title: 'اقتراب موعد مراجعة شهادة الجودة',
    message: 'تذكير: يرجى استكمال إجراءات فحص عينات عسل السدر اليمني بهيئة المقاييس لتجنب تأخر الشحن الجوي لمطار دبي.',
    type: 'info',
    timestamp: '2026-07-16 14:00',
    isRead: true,
    category: 'deadline'
  }
];

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enableDocsArrival: true,
  enableCustomsStart: true,
  enableDeadlineApproaching: true,
  enablePotentialDelays: true,
  deadlineThresholdDays: 3,
  soundEnabled: true
};

export default function App() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracking' | 'documents' | 'alerts' | 'guide' | 'workspace'>('dashboard');
  const [workspaceToken, setWorkspaceTokenState] = useState<string | null>(null);
  
  // إشعارات وإعدادات التنبيه
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(DEFAULT_ALERT_CONFIG);

  // حالة المستخدم والربط السحابي لـ Firebase
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // حالة تثبيت PWA والتشغيل أوفلاين
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsPwaInstalled(true);
      setPwaPrompt(null);
    }
  };

  // مراقبة حالة تسجيل الدخول الجمركي سحابياً
  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }
  }, []);

  // ربط ومزامنة البيانات حياً عبر Firestore عند توفر الاتصال وتسجيل الدخول
  useEffect(() => {
    if (!isFirebaseEnabled || !db || !user) {
      return;
    }

    const pathShipments = 'shipments';
    const unsubShipments = onSnapshot(collection(db, pathShipments), (snapshot) => {
      const list: Shipment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Shipment);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // تهيئة البيانات السحابية في حال كانت فارغة
      if (list.length === 0) {
        INITIAL_SHIPMENTS.forEach(async (ship) => {
          try {
            await setDoc(doc(db!, pathShipments, ship.id), ship);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `${pathShipments}/${ship.id}`);
          }
        });
      } else {
        setShipments(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathShipments);
    });

    const pathNotifications = 'notifications';
    const unsubNotifications = onSnapshot(collection(db, pathNotifications), (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as AppNotification);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (list.length === 0) {
        INITIAL_NOTIFICATIONS.forEach(async (notif) => {
          try {
            await setDoc(doc(db!, pathNotifications, notif.id), notif);
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `${pathNotifications}/${notif.id}`);
          }
        });
      } else {
        setNotifications(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathNotifications);
    });

    const pathConfig = `alertConfig/${user.uid}`;
    const unsubConfig = onSnapshot(doc(db, 'alertConfig', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setAlertConfig(snapshot.data() as AlertConfig);
      } else {
        setDoc(doc(db!, 'alertConfig', user.uid), DEFAULT_ALERT_CONFIG)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, pathConfig));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathConfig);
    });

    return () => {
      unsubShipments();
      unsubNotifications();
      unsubConfig();
    };
  }, [user]);

  // دالة تسجيل الدخول بمحرك Google المعتمد
  const handleSignIn = async () => {
    if (!isFirebaseEnabled || !auth) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // إضافة نطاقات الصلاحيات المطلوبة لخدمات Google Workspace
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/documents');
      provider.addScope('https://www.googleapis.com/auth/contacts');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.addScope('https://www.googleapis.com/auth/calendar');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      if (token) {
        setWorkspaceTokenState(token);
        setWorkspaceToken(token);
      }
    } catch (e) {
      console.error("Firebase Login Error:", e);
      alert("فشل الربط والاتصال السحابي. يرجى التحقق من إعدادات وقيود Firebase.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // دالة الخروج الجمركي الآمن
  const handleSignOut = async () => {
    if (isFirebaseEnabled && auth) {
      try {
        await signOut(auth);
        setWorkspaceTokenState(null);
        setWorkspaceToken(null);
      } catch (e) {
        console.error("Firebase Logout Error:", e);
      }
    }
  };

  // تحميل الشحنات والإشعارات والإعدادات من التخزين المحلي كخيار احتياطي ومبدئي
  useEffect(() => {
    const savedShipments = localStorage.getItem('customs_sim_shipments');
    if (savedShipments) {
      try {
        setShipments(JSON.parse(savedShipments));
      } catch (e) {
        setShipments(INITIAL_SHIPMENTS);
      }
    } else {
      setShipments(INITIAL_SHIPMENTS);
    }

    const savedNotifications = localStorage.getItem('customs_sim_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        setNotifications(INITIAL_NOTIFICATIONS);
      }
    } else {
      setNotifications(INITIAL_NOTIFICATIONS);
    }

    const savedConfig = localStorage.getItem('customs_sim_alert_config');
    if (savedConfig) {
      try {
        setAlertConfig(JSON.parse(savedConfig));
      } catch (e) {
        setAlertConfig(DEFAULT_ALERT_CONFIG);
      }
    }
  }, []);

  // حفظ الشحنات في التخزين المحلي
  const saveShipments = (newShipments: Shipment[]) => {
    setShipments(newShipments);
    localStorage.setItem('customs_sim_shipments', JSON.stringify(newShipments));
  };

  // حفظ الإشعارات في التخزين المحلي
  const saveNotifications = (newNotifs: AppNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('customs_sim_notifications', JSON.stringify(newNotifs));
  };

  // حفظ التخصيص للإشعارات / سحابياً
  const saveAlertConfig = async (newConfig: AlertConfig) => {
    setAlertConfig(newConfig);
    localStorage.setItem('customs_sim_alert_config', JSON.stringify(newConfig));

    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'alertConfig', user.uid), newConfig);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `alertConfig/${user.uid}`);
      }
    }
  };

  // إضافة شحنة جديدة
  const handleAddShipment = async (newShipment: Shipment) => {
    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'shipments', newShipment.id), newShipment);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `shipments/${newShipment.id}`);
      }
    } else {
      const updated = [newShipment, ...shipments];
      saveShipments(updated);
    }
    
    // إرسال إشعار فوري بشراء البضاعة
    triggerNotification(
      'customs',
      `شراء شحنة جديدة: ${newShipment.title}`,
      `تم تحرير طلب معاملة الشراء رقم ${newShipment.code} بنجاح من المورد الأصلي لـ طه رضوان للخدمات اللوجستية.`,
      'success',
      newShipment.id,
      newShipment.code
    );

    setSelectedShipment(newShipment);
  };

  // تحديث شحنة قائمة
  const handleUpdateShipment = async (updatedShipment: Shipment) => {
    const previousShipment = shipments.find(s => s.id === updatedShipment.id);
    
    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'shipments', updatedShipment.id), updatedShipment);
        setSelectedShipment(updatedShipment);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `shipments/${updatedShipment.id}`);
      }
    } else {
      const updated = shipments.map(s => s.id === updatedShipment.id ? updatedShipment : s);
      saveShipments(updated);
      setSelectedShipment(updatedShipment);
    }

    // التحقق من الانتقال بين الحالات الجمركية لتوليد تنبيهات تلقائية فائقة الجودة
    if (previousShipment && previousShipment.currentStatus !== updatedShipment.currentStatus) {
      let title = 'تحديث الحالة اللوجستية';
      let msg = `تم انتقال شحنتك (${updatedShipment.title}) للمرحلة اللوجستية الجديدة بنجاح.`;
      let type: AppNotification['type'] = 'info';
      let cat: AppNotification['category'] = 'customs';

      if (updatedShipment.currentStatus === 'released') {
        title = 'مصلحة الجمارك: صدور الفسح الجمركي! 🔑';
        msg = `بشرى سارة: تم إصدار وثيقة الترخيص والفسح الموحد للشحنة رقم ${updatedShipment.code} من ميناء التفريغ وبانتظار النقل البري.`;
        type = 'success';
        cat = 'customs';
      } else if (updatedShipment.currentStatus === 'in_transit') {
        title = 'قيد الطريق برياً بالترانزيت 🚚';
        msg = `تحركت القافلة الناقلة ومستند الختم الجمركي جاهز برقم الحاوية ${updatedShipment.containerNumber} باتجاه مخازن التاجر.`;
        type = 'info';
        cat = 'delay';
      } else if (updatedShipment.currentStatus === 'delivered') {
        title = 'ألف مبروك: تم التسليم للمستودعات 🎉';
        msg = `وصلت الشحنة المخلصة رقم ${updatedShipment.code} إلى مخازن ومستودعات التاجر بنجاح مع الفرز والتأمين الجمركي الكامل.`;
        type = 'success';
        cat = 'customs';
      } else if (updatedShipment.currentStatus === 'payment_pending') {
        title = 'المطالبة الجمركية: بانتظار سداد الرسوم 🧾';
        msg = `تم احتساب الرسوم والضرائب جمركياً بقيمة ${updatedShipment.valueLocal.toLocaleString()} ريال يمني. الرجاء السداد الفوري لسرعة الخروج.`;
        type = 'warning';
        cat = 'deadline';
      }

      triggerNotification(cat, title, msg, type, updatedShipment.id, updatedShipment.code);
    }
  };

  // إضافة مستند جديد لشحنة قائمة (عبر إدارة الوثائق الرقمية)
  const handleAddDocument = async (shipmentId: string, newDoc: Document) => {
    const target = shipments.find(s => s.id === shipmentId);
    if (!target) return;

    const updatedDocs = [...target.documents.filter(d => d.type !== newDoc.type), newDoc];
    const updatedShipment = {
      ...target,
      documents: updatedDocs,
      logs: [
        {
          id: `log_doc_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: target.currentStatus,
          message: `تم رفع وتحديث مستند جديد (${newDoc.title}) رقم المرجع ${newDoc.fileNumber} في قاعدة البيانات الرقمية.`,
          userAction: true
        },
        ...target.logs
      ]
    };

    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'shipments', shipmentId), updatedShipment);
        if (selectedShipment?.id === shipmentId) {
          setSelectedShipment(updatedShipment);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `shipments/${shipmentId}`);
      }
    } else {
      const updatedList = shipments.map(s => s.id === shipmentId ? updatedShipment : s);
      saveShipments(updatedList);
      if (selectedShipment?.id === shipmentId) {
        setSelectedShipment(updatedShipment);
      }
    }

    // إطلاق إشعار ذكي
    triggerNotification(
      'docs',
      'تحديث وثيقة جمركية رقمية',
      `تم رفع وتدقيق ورقة (${newDoc.title}) رقم ${newDoc.fileNumber} بنجاح لشحنتك اللوجستية.`,
      'success',
      shipmentId,
      target.code
    );
  };

  // تحديث مستند حالي لشحنة قائمة
  const handleUpdateDocument = async (shipmentId: string, docId: string, updatedDoc: Document) => {
    const target = shipments.find(s => s.id === shipmentId);
    if (!target) return;

    const updatedDocs = target.documents.map(d => d.id === docId ? updatedDoc : d);
    const updatedShipment = { ...target, documents: updatedDocs };

    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'shipments', shipmentId), updatedShipment);
        if (selectedShipment?.id === shipmentId) {
          setSelectedShipment(updatedShipment);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `shipments/${shipmentId}`);
      }
    } else {
      const updatedList = shipments.map(s => s.id === shipmentId ? updatedShipment : s);
      saveShipments(updatedList);
      if (selectedShipment?.id === shipmentId) {
        setSelectedShipment(updatedShipment);
      }
    }
  };

  // استيراد شحنات من Google Sheets
  const handleImportShipments = (importedList: Shipment[]) => {
    const updated = [...importedList, ...shipments];
    saveShipments(updated);
    if (isFirebaseEnabled && db && user) {
      importedList.forEach(async (s) => {
        try {
          await setDoc(doc(db!, 'shipments', s.id), s);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `shipments/${s.id}`);
        }
      });
    }
  };

  // ربط جهة اتصال مستوردة بشحنة
  const handleLinkContactToShipment = (contactName: string) => {
    if (shipments.length > 0) {
      const first = { ...shipments[0], clientName: contactName };
      handleUpdateShipment(first);
    }
  };

  // إطلاق إشعار فوري جديد مع محاكاة الصوت
  const triggerNotification = async (
    category: AppNotification['category'],
    title: string,
    message: string,
    type: AppNotification['type'],
    shipmentId?: string,
    shipmentCode?: string
  ) => {
    // التحقق من تفضيلات التنبيه المعينة من المستخدم
    if (category === 'docs' && !alertConfig.enableDocsArrival) return;
    if (category === 'customs' && !alertConfig.enableCustomsStart) return;
    if (category === 'deadline' && !alertConfig.enableDeadlineApproaching) return;
    if (category === 'delay' && !alertConfig.enablePotentialDelays) return;

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      shipmentId,
      shipmentCode,
      title,
      message,
      type,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
      category
    };

    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `notifications/${newNotif.id}`);
      }
    } else {
      saveNotifications([newNotif, ...notifications]);
    }

    // محاكاة الصوت في المتصفح إذا تم تمكينه
    if (alertConfig.soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // نغمة مرتفعة مريحة
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // تجاهل أي قفل للمتصفح على تشغيل الأصوات دون تفاعل مسبق
      }
    }
  };

  // تفعيل التنبيهات التجريبية للمحاكاة
  const handleTriggerMockAlert = (category: 'docs' | 'customs' | 'deadline' | 'delay', shipmentId?: string) => {
    const targetShip = shipments.find(s => s.id === shipmentId) || shipments[0];
    if (!targetShip) return;

    let title = '';
    let msg = '';
    let type: AppNotification['type'] = 'info';

    switch (category) {
      case 'docs':
        title = 'وصول مستند رسمي جديد 📄';
        msg = `تم استلام شهادة جودة وفحص مطابقة المعايير الوطنية معتمدة من الغرفة التجارية لشحنتك رقم ${targetShip.code}.`;
        type = 'success';
        break;
      case 'customs':
        title = 'مصلحة الجمارك: بدء المعاينة الميدانية 🔎';
        msg = `تمت تصفية المعاملة رقم ${targetShip.code} وإحالتها للمفتش الجمركي المعتمد بالساحة لتطبيقه الأوزان والعدد الفعلي.`;
        type = 'info';
        break;
      case 'deadline':
        title = 'تحذير جمركي: اقتراب انتهاء مهلة المناولة ⚠️';
        msg = `تنبيه: متبقي أقل من ${alertConfig.deadlineThresholdDays} أيام على مهلة بقاء الحاوية ${targetShip.containerNumber} بالرصيف لتفادي غرامة الأرضية.`;
        type = 'warning';
        break;
      case 'delay':
        title = 'إنذار ميداني: تأخير جمركي أو مناخي 🛑';
        msg = `يوجد تكدس مؤقت بساحة الموازين والترصيص الجمركي بميناء التفريغ، يرجى متابعة المندوب طه رضوان لتسريع المعاملة.`;
        type = 'delay';
        break;
    }

    triggerNotification(category, title, msg, type, targetShip.id, targetShip.code);
    alert(`محاكاة: تم إرسال تنبيه (${title}) بنجاح. تفقد شريط مركز التنبيهات المباشر.`);
  };

  // وضع علامة مقروء على التنبيه
  const handleMarkRead = async (notifId: string) => {
    const targetNotif = notifications.find(n => n.id === notifId);
    if (!targetNotif) return;

    const updatedNotif = { ...targetNotif, isRead: true };

    if (isFirebaseEnabled && db && user) {
      try {
        await setDoc(doc(db, 'notifications', notifId), updatedNotif);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `notifications/${notifId}`);
      }
    } else {
      const updated = notifications.map(n => n.id === notifId ? updatedNotif : n);
      saveNotifications(updated);
    }
  };

  // تحديد الكل مقروء
  const handleMarkAllRead = async () => {
    if (isFirebaseEnabled && db && user) {
      for (const notif of notifications) {
        if (!notif.isRead) {
          try {
            await setDoc(doc(db, 'notifications', notif.id), { ...notif, isRead: true });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `notifications/${notif.id}`);
          }
        }
      }
    } else {
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      saveNotifications(updated);
    }
  };

  // تصفير قائمة الإشعارات
  const handleClearNotifications = async () => {
    if (isFirebaseEnabled && db && user) {
      for (const notif of notifications) {
        try {
          await deleteDoc(doc(db, 'notifications', notif.id));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `notifications/${notif.id}`);
        }
      }
    } else {
      saveNotifications([]);
    }
  };

  // إعادة ضبط قاعدة البيانات الأولية للمحاكي
  const handleResetSimulator = async () => {
    if (confirm("هل أنت متأكد من إعادة ضبط المحاكي وتفريغ المعاملات الجديدة للبدء من جديد؟")) {
      localStorage.removeItem('customs_sim_shipments');
      localStorage.removeItem('customs_sim_notifications');
      localStorage.removeItem('customs_sim_alert_config');
      
      if (isFirebaseEnabled && db && user) {
        try {
          for (const s of shipments) {
            await deleteDoc(doc(db, 'shipments', s.id));
          }
          for (const n of notifications) {
            await deleteDoc(doc(db, 'notifications', n.id));
          }
          for (const s of INITIAL_SHIPMENTS) {
            await setDoc(doc(db, 'shipments', s.id), s);
          }
          for (const n of INITIAL_NOTIFICATIONS) {
            await setDoc(doc(db, 'notifications', n.id), n);
          }
          await setDoc(doc(db, 'alertConfig', user.uid), DEFAULT_ALERT_CONFIG);
        } catch (e) {
          console.error("Firebase reset failed:", e);
        }
      }

      setShipments(INITIAL_SHIPMENTS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setAlertConfig(DEFAULT_ALERT_CONFIG);
      setSelectedShipment(null);
      setActiveTab('dashboard');
      alert("تم إعادة تهيئة قاعدة البيانات الجمركية والمستندات الافتراضية بنجاح.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans" dir="rtl">
      {/* الهيدر العلوي الموحد لطه رضوان للخدمات اللوجستية */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* جهة اليمين: عنوان واسم التطبيق بالتفصيل اللائق لطه رضوان */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md animate-pulse">
                <Layers size={20} />
              </div>
              <div>
                <h1 className="text-xs sm:text-base font-extrabold text-white flex items-center gap-1.5">
                  <span>طه رضوان للخدمات اللوجستية</span>
                  <span className="text-[9px] bg-emerald-500 text-white font-sans font-bold px-2 py-0.5 rounded-full border border-emerald-400">
                    نظام التخليص الجمركي اليمني الموحد
                  </span>
                </h1>
                <p className="text-[9px] text-slate-300 mt-0.5">من الشراء والموانئ العالمية حتى مستودعات التجار بالجمهورية اليمنية</p>
              </div>
            </div>

            {/* الأقسام التبويبية المتكاملة للتصفح السريع للـ 5 واجهات */}
            <nav className="hidden lg:flex items-center gap-1">
              <button 
                onClick={() => {
                  setSelectedShipment(null);
                  setActiveTab('dashboard');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'dashboard' && !selectedShipment ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Package size={14} />
                <span>الرئيسية والمعاملات</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedShipment(null);
                  setActiveTab('tracking');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'tracking' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <MapPin size={14} className="text-emerald-400" />
                <span>تتبع الشحنات الجغرافي</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedShipment(null);
                  setActiveTab('documents');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'documents' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <FolderClosed size={14} />
                <span>الأرشيف والمستندات</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedShipment(null);
                  setActiveTab('alerts');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'alerts' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'} relative`}
              >
                <BellRing size={14} />
                <span>مركز التنبيهات</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-1 -left-1 w-2 h-2 bg-rose-550 rounded-full"></span>
                )}
              </button>

              <button 
                onClick={() => {
                  setSelectedShipment(null);
                  setActiveTab('guide');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'guide' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <BookOpen size={14} />
                <span>المعرفة والدليل الجمركي</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedShipment(null);
                  setActiveTab('workspace');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'workspace' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Globe size={14} className="text-emerald-400" />
                <span>بوابة Google Workspace</span>
              </button>
            </nav>

            {/* جهة اليسار: أزرار التحكم وإعادة التصفير والربط السحابي */}
            <div className="flex items-center gap-3">
              {/* Firebase / Cloud Sync Widget */}
              {isFirebaseEnabled ? (
                user ? (
                  <div className="flex items-center gap-2 border-l border-slate-800 pl-3 font-sans">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="متصل بالربط السحابي" />
                    <div className="hidden md:block text-right">
                      <span className="text-[8px] text-slate-400 block">حساب السحاب الموثق</span>
                      <span className="text-[10px] font-bold text-white block truncate max-w-[100px]">{user.displayName || user.email}</span>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="text-[9px] bg-slate-800 hover:bg-slate-700 text-rose-400 px-2 py-0.5 rounded border border-slate-700 transition-colors mr-1"
                    >
                      خروج
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleSignIn}
                    disabled={isLoggingIn}
                    className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl transition-all shadow-xs border border-emerald-500"
                  >
                    <RefreshCw size={11} className={isLoggingIn ? "animate-spin" : ""} />
                    <span>ربط سحابي</span>
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-850 px-2 py-1 rounded border border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>تخزين محلي (أوفلاين)</span>
                </div>
              )}

              {/* زر أو مؤشر تثبيت PWA */}
              {pwaPrompt ? (
                <button
                  onClick={handleInstallPWA}
                  className="flex items-center gap-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl transition-all shadow-xs border border-emerald-500 cursor-pointer"
                  title="تثبيت التطبيق كـ PWA على جهازك للعمل بدون إنترنت وبسرعة تامة"
                >
                  <span>تثبيت التطبيق 📱</span>
                </button>
              ) : isPwaInstalled ? (
                <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-1.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>تطبيق PWA نشط بالكامل</span>
                </div>
              ) : null}

              <button 
                onClick={handleResetSimulator}
                title="إعادة ضبط المحاكي"
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800 bg-slate-900"
              >
                <RefreshCw size={14} />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 text-right border-r border-slate-800 pr-3">
                <span className="text-[10px] text-slate-400 block font-sans">الوكيل ومسؤول التخليص</span>
                <span className="text-xs font-bold text-white font-sans block">طه رضوان اللوجستية</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* شريط التنقل المتجاوب للهواتف المحمولة */}
      <div className="lg:hidden bg-slate-900 p-2 flex gap-1 overflow-x-auto border-b border-slate-800 select-none">
        <button 
          onClick={() => {
            setSelectedShipment(null);
            setActiveTab('dashboard');
          }}
          className={`flex-shrink-0 flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'dashboard' && !selectedShipment ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          <Package size={14} />
          <span>الرئيسية</span>
        </button>
        <button 
          onClick={() => {
            setSelectedShipment(null);
            setActiveTab('tracking');
          }}
          className={`flex-shrink-0 flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'tracking' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          <MapPin size={14} />
          <span>تتبع الشحنات</span>
        </button>
        <button 
          onClick={() => {
            setSelectedShipment(null);
            setActiveTab('documents');
          }}
          className={`flex-shrink-0 flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'documents' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          <FolderClosed size={14} />
          <span>الأرشيف</span>
        </button>
        <button 
          onClick={() => {
            setSelectedShipment(null);
            setActiveTab('alerts');
          }}
          className={`flex-shrink-0 flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'alerts' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          <BellRing size={14} />
          <span>التنبيهات</span>
        </button>
        <button 
          onClick={() => {
            setSelectedShipment(null);
            setActiveTab('guide');
          }}
          className={`flex-shrink-0 flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'guide' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          <BookOpen size={14} />
          <span>الدليل المعرفي</span>
        </button>
        <button 
          onClick={() => {
            setSelectedShipment(null);
            setActiveTab('workspace');
          }}
          className={`flex-shrink-0 flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'workspace' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          <Globe size={14} className="text-emerald-400" />
          <span>جوجل سحابة</span>
        </button>
      </div>

      {/* المحتوى الرئيسي للبرنامج */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedShipment ? (
          // واجهة تفاصيل الشحنة النشطة ومتابعة خطوات التخليص الـ 10 التفاعلية
          <ActiveShipmentDetails 
            shipment={selectedShipment} 
            onUpdateShipment={handleUpdateShipment}
            onBackToList={() => setSelectedShipment(null)}
          />
        ) : activeTab === 'dashboard' ? (
          // لوحة التحكم الرئيسية: البطاقات الإحصائية والبحث والقائمة وشراء البضاعة
          <div className="space-y-6">
            <DashboardStats shipments={shipments} />
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8">
                <CostAnalysisChart shipments={shipments} />
              </div>
              <div className="xl:col-span-4">
                <CustomsCalculator />
              </div>
            </div>

            <ShipmentList 
              shipments={shipments}
              onSelectShipment={setSelectedShipment}
              onAddShipment={handleAddShipment}
            />
          </div>
        ) : activeTab === 'tracking' ? (
          // واجهة التتبع الجغرافي بالوقت الحقيقي والتفاعلية التامة
          <TrackingMap shipments={shipments} />
        ) : activeTab === 'documents' ? (
          // أرشيف الوثائق الرقمية المتكامل مع الرفع والتحميل
          <DigitalDocumentCenter 
            shipments={shipments} 
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
          />
        ) : activeTab === 'alerts' ? (
          // مركز التنبيهات المخصص مع توليد التنبيهات المحاكية للامتحان العملي
          <AlertSettings 
            notifications={notifications}
            alertConfig={alertConfig}
            shipments={shipments}
            onUpdateConfig={saveAlertConfig}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onClearNotifications={handleClearNotifications}
            onTriggerMockAlert={handleTriggerMockAlert}
          />
        ) : activeTab === 'workspace' ? (
          // بوابة تكامل جوجل وورك سبيس للمزامنة السحابية الحية
          <GoogleWorkspacePanel 
            shipments={shipments}
            token={workspaceToken}
            onImportShipments={handleImportShipments}
            onLinkContactToShipment={handleLinkContactToShipment}
            onLoginWorkspace={handleSignIn}
            isLoggingIn={isLoggingIn}
          />
        ) : (
          // الدليل التعليمي المعرفي
          <CustomsGuide />
        )}
      </main>

      {/* الفوتر الموحد للتطبيق لطه رضوان للخدمات اللوجستية */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white font-bold">
            <GraduationCap size={16} className="text-emerald-400" />
            <span>نظام محاكاة متكامل لـ "دورة التخليص الجمركي والخدمات اللوجستية" - طه رضوان للخدمات اللوجستية</span>
          </div>
          <p className="text-[10px] text-slate-400 max-w-3xl mx-auto leading-relaxed">
            تم التطوير طبقاً لأحدث إجراءات التخليص بموانئ الجمهورية اليمنية البرية والبحرية والجوية (منفذ شحن، ميناء عدن، ميناء الحديدة، ميناء المكلا، منفذ الوديعة، ومطار صنعاء) بالتنسيق المباشر مع مصلحة الجمارك وهيئة المواصفات والمقاييس لضبط الجودة وتسهيل الاستيراد والتصدير.
          </p>
          <p className="text-[9px] text-slate-500 font-sans">
            حقوق الطبع والنشر © {new Date().getFullYear()} طه رضوان للخدمات اللوجستية والتخليص الجمركي. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
