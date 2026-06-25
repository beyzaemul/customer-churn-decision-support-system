import React, { useState, useEffect } from 'react';
import { Users, Activity, Save, Trash2, TrendingUp, BarChart2, Lightbulb, PlayCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [gender, setGender] = useState("0");
  const [seniorCitizen, setSeniorCitizen] = useState("0");
  const [tenure, setTenure] = useState(12);
  const [monthlyCharges, setMonthlyCharges] = useState(70.0);
  const [totalCharges, setTotalCharges] = useState(840.0);
  const [contract, setContract] = useState("Month-to-month");
  const [internetService, setInternetService] = useState("Fiber optic");
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [newScenarioName, setNewScenarioName] = useState(""); 

  const [riskScore, setRiskScore] = useState(0);
  const [factors, setFactors] = useState([]);

  const [savedScenarios, setSavedScenarios] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [previewResultText, setPreviewResultText] = useState("");

  const [isLoadedScenarioMode, setIsLoadedScenarioMode] = useState(false);

  const intValue = (val) => {
    if (val === "1" || val === 1 || val === true) return 1;
    return 0;
  };

  
  const fetchRiskPrediction = async (customParams = null) => {
    const payload = customParams ? customParams : {
      gender: intValue(gender),
      SeniorCitizen: intValue(seniorCitizen),
      tenure: parseInt(tenure),
      MonthlyCharges: parseFloat(monthlyCharges),
      TotalCharges: parseFloat(totalCharges),
      Contract: contract,
      InternetService: internetService
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      // Backend'den gelen 'churn_probability' ve 'risk_factors' kullanılıyor
      if (data.churn_probability !== undefined) {
        setRiskScore(data.churn_probability);
        setFactors(data.risk_factors || []);
      }
    } catch (error) {
      console.error("Tahmin API Hatası:", error);
    }
  };

  const loadScenariosFromDB = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/scenarios');
      const data = await response.json();
      setSavedScenarios(data);
    } catch (error) {
      console.error("Veritabanı yükleme hatası:", error);
    }
  };

const executeSaveScenario = async () => {
    const trimmedName = newScenarioName.trim();
    if (!trimmedName) {
      alert("Lütfen geçerli bir senaryo ismi giriniz.");
      return;
    }

    const currentMonthly = parseFloat(monthlyCharges);
    const simulatedMonthly = riskScore >= 65 && contract === "Month-to-month" 
      ? Math.round((currentMonthly * 0.75) * 100) / 100 
      : (riskScore >= 40 && internetService === "Fiber optic" ? Math.max(18, Math.round((currentMonthly - 15) * 100) / 100) : currentMonthly);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScenarioName.trim(),
          contract: contract,
          internetService: internetService,
          tenure: parseInt(tenure),
          monthly: parseFloat(simulatedMonthly),
          score: parseFloat(riskScore),
          gender: parseInt(gender),                 
          seniorCitizen: parseInt(seniorCitizen)    
        })
      });

      if (response.ok) {
        await loadScenariosFromDB();
        setNewScenarioName("");
        setIsModalOpen(false);
      } else {
        alert("Senaryo backend veritabanına kaydedilemedi.");
      }
    } catch (error) {
      console.error("Veritabanı kayıt hatası:", error);
      alert("Backend API bağlantı hatası oluştu.");
    }
  };
const saveScenarioToDB = () => {
    const today = new Date().toLocaleDateString('tr-TR');
    setNewScenarioName(`Senaryo_${today}`);
    setIsModalOpen(true);
};


  const deleteScenarioFromDB = async (id) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/scenarios/${id}`, { method: 'DELETE' });
      loadScenariosFromDB();
    } catch (error) {
      console.error("Veritabanı silme hatası:", error);
    }
  };

  const loadSelectedScenario = (scenario) => {

    setContract(scenario.contract);
    setInternetService(scenario.internetService);
    setTenure(parseInt(scenario.tenure));
    setMonthlyCharges(parseFloat(scenario.monthly));
 
    setGender(parseInt(scenario.gender || 0));
    setSeniorCitizen(parseInt(scenario.seniorCitizen || 0));

    const calculatedTotal = Math.round((parseFloat(scenario.monthly) * parseInt(scenario.tenure)) * 100) / 100;
    setTotalCharges(calculatedTotal);
    
    // 3. Risk skorunu set ediyoruz
    setRiskScore(parseFloat(scenario.score));
    
    // Eski aksiyon ve önizleme yazılarını temizliyoruz
    setActiveRecommendation(null);
    setPreviewResultText("");
  };

  useEffect(() => { 
    loadScenariosFromDB();
    fetchRiskPrediction(); 
  }, []);
  
  // 🌟 ANLIK GÜNCELLEME GARANTİSİ VEREN SEYRETMELİK INPUT AKIŞI
  const handleInputChange = (setter, value, updatedField = null) => {
    setIsLoadedScenarioMode(false);
    setter(value);

    // React'ın asenkron state gecikmesini aşmak için anlık payload oluşturuyoruz:
    const updatedPayload = {
      gender: updatedField === 'gender' ? intValue(value) : intValue(gender),
      SeniorCitizen: updatedField === 'seniorCitizen' ? intValue(value) : intValue(seniorCitizen),
      tenure: updatedField === 'tenure' ? parseInt(value) : parseInt(tenure),
      MonthlyCharges: updatedField === 'monthlyCharges' ? parseFloat(value) : parseFloat(monthlyCharges),
      TotalCharges: updatedField === 'monthlyCharges' 
        ? parseFloat(value) * tenure 
        : updatedField === 'tenure' ? monthlyCharges * parseInt(value) : parseFloat(totalCharges),
      Contract: updatedField === 'contract' ? value : contract,
      InternetService: updatedField === 'internetService' ? value : internetService
    };

    // Beklemeden doğrudan güncel veriyi backend'e yolluyoruz
    fetchRiskPrediction(updatedPayload);
  };

  // Grafik Verisini Güncelleme
  useEffect(() => {
    setChartData([
      { name: '3 Ay', Risk: Math.min(100, Math.max(0, Math.round(riskScore * 1.3))) },
      { name: '12 Ay', Risk: Math.round(riskScore) },
      { name: '24 Ay', Risk: Math.round(riskScore * 0.8) },
      { name: '48 Ay', Risk: Math.round(riskScore * 0.5) },
    ]);
  }, [riskScore]);

  // Aksiyon Planı Öneri Algoritması
  const handleGenerateRecommendation = () => {
    setPreviewResultText(""); 
    const currentMonthly = parseFloat(monthlyCharges);
    const currentYearlyRevenue = Math.round(currentMonthly * 12);
    const riskValue = Math.round(currentYearlyRevenue * (riskScore / 100));

    if (riskScore >= 65 && contract === "Month-to-month") {
      const simulatedMonthly = Math.round((currentMonthly * 0.75) * 100) / 100;
      const simulatedYearlyRevenue = Math.round(simulatedMonthly * 12);
      const retentionCost = currentYearlyRevenue - simulatedYearlyRevenue; 
      const netFinancialGain = riskValue - retentionCost;

      setActiveRecommendation({
        title: "Stratejik Karar ve Finansal Kârlılık Analizi: Sözleşme Reformu",
        desc: `Müşteri taahhütsüz statüde ve terk riski %${riskScore} seviyesinde. Hiçbir aksiyon alınmazsa şirket için yıllık potansiyel ciro kaybı riski tam ${riskValue} $'dır. Bu müşteriye %25 indirimle 1 Yıllık Taahhüt sunulduğunda şirketin feragat edeceği tutar (Elde Tutma Maliyeti) yıllık ${retentionCost} $ olacaktır. Ancak bu hamle müşteriyi sistemde tutacağı için şirket masadaki ${netFinancialGain} $'lık riskli ciroyu kurtarmış ve kasasını güvenceye almış olur.`,
        actionType: "contract_upgrade",
        financials: { riskValue, retentionCost, netFinancialGain }
      });
    } else if (riskScore >= 40 && internetService === "Fiber optic") {
      const simulatedMonthly = Math.max(18, Math.round((currentMonthly - 15) * 100) / 100);
      const simulatedYearlyRevenue = Math.round(simulatedMonthly * 12);
      const retentionCost = currentYearlyRevenue - simulatedYearlyRevenue;
      const netFinancialGain = riskValue - retentionCost;

      setActiveRecommendation({
        title: "Stratejik Karar ve Finansal Kârlılık Analizi: Fiber Optik Segment Koruma",
        desc: `Fiber optik altyapısına sahip segmentteki bu müşterinin terk riski %${riskScore} seviyesindedir. Aksiyonsuz kalındığında yıllık ciro kaybı riski ${riskValue} $'dır. Segment koruma stratejisi kapsamında müşteriye aylık 15 $ indirim tanımlandığında, bu aksiyonun şirkete yıllık maliyeti ${retentionCost} $ olacaktır. Bu hamleyle yüksek değerli fiber abonesi sistemde tutulduğu takdirde, şirketin kurtardığı net finansal hacim/kazanç ${netFinancialGain} $ olarak hesaplanmıştır.`,
        actionType: "fiber_fix",
        financials: { riskValue, retentionCost, netFinancialGain }
      });
    } else {
      setActiveRecommendation({
        title: "Stratejik Karar Yorumu: Güvenli/Stabil Segment",
        desc: `Müşterinin mevcut kayıp riski (%${riskScore}) kurumsal barajların altındadır. Herhangi bir agresif indirim yapılmasına gerek yoktur. Gereksiz indirim yapmak şirketin kâr marjını doğrudan düşüreceği için mevcut tarife ve operasyonel süreç aynen korunmalıdır.`,
        actionType: "none",
        financials: null
      });
    }
  };

  const applyAndPreviewAction = async () => {
    if (!activeRecommendation) return;

    let nextContract = contract;
    let nextMonthly = parseFloat(monthlyCharges);
    let nextTenure = parseInt(tenure);

    if (activeRecommendation.actionType === "contract_upgrade") {
      nextContract = "One year";
      nextMonthly = Math.round((monthlyCharges * 0.75) * 100) / 100;
      nextTenure = Math.min(72, nextTenure + 12);
    } else if (activeRecommendation.actionType === "fiber_fix") {
      nextMonthly = Math.max(18, Math.round((monthlyCharges - 15) * 100) / 100);
    }

    const nextTotal = Math.round((nextMonthly * nextTenure) * 100) / 100;

    // Payload'u oluştur
    const payload = {
      gender: intValue(gender),
      SeniorCitizen: intValue(seniorCitizen),
      tenure: nextTenure,
      MonthlyCharges: nextMonthly,
      TotalCharges: nextTotal,
      Contract: nextContract,
      InternetService: internetService
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Backend Yanıtı:", data); // F12 -> Konsol'dan buraya bakın

      if (data.churn_probability !== undefined) {
        // State güncellemeleri
        setContract(nextContract);
        setMonthlyCharges(nextMonthly);
        setTenure(nextTenure);
        setTotalCharges(nextTotal);
        
        setRiskScore(data.churn_probability); 
        setFactors(data.risk_factors || []); // Faktörleri de güncelleyelim
        setPreviewResultText(`Uygulanan stratejik hamle sonrasında müşterinin güncel kayıp riskinin %${data.churn_probability} olması beklenmektedir.`);
      }
    } catch (error) {
      console.error("API Hatası:", error);
    }
  };

  const getRiskStyle = (score) => {
    if (score < 35) return { color: '#16a34a', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' };
    if (score < 65) return { color: '#ca8a04', backgroundColor: '#fefce8', borderColor: '#fef08a' };
    return { color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' };
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* Üst Header */}
      <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={28} color="#38bdf8" /> Karar Destek Sistemi 
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Yapay Zeka Destekli Karar Simülasyonu ve Finansal Öngörü Raporu
          </p>
        </div>
        <button onClick={saveScenarioToDB} style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Save size={18} />Kaydet
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Sol Panel: Giriş Kriterleri */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={18} color="#0f172a" /> Simülasyon Kriterleri
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#475569' }}>Cinsiyet</label>
              <select value={gender} onChange={(e) => handleInputChange(setGender, e.target.value, 'gender')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="0">Kadın</option>
                <option value="1">Erkek</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#475569' }}>Yaş Grubu</label>
              <select value={seniorCitizen} onChange={(e) => handleInputChange(setSeniorCitizen, e.target.value, 'seniorCitizen')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="0">Genç / Orta Yaş</option>
                <option value="1">65 Yaş Üstü</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#475569' }}>Sözleşme Türü</label>
              <select value={contract} onChange={(e) => handleInputChange(setContract, e.target.value, 'contract')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '500' }}>
                <option value="Month-to-month">Aydan Aya (Taahhütsüz)</option>
                <option value="One year">1 Yıllık Taahhüt</option>
                <option value="Two year">2 Yıllık Taahhüt</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#475569' }}>İnternet Altyapısı</label>
              <select value={internetService} onChange={(e) => handleInputChange(setInternetService, e.target.value, 'internetService')} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Fiber optic">Fiber Optik</option>
                <option value="DSL">DSL (Kablo/Bakır)</option>
                <option value="No">İnternet Hizmeti Yok</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#475569' }}>Aylık Sadakat Süresi (Tenure)</span>
              <span style={{ fontWeight: 'bold' }}>{tenure} Ay</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="72" 
              value={tenure} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                handleInputChange(setTenure, val, 'tenure');
                setTotalCharges(Math.round((monthlyCharges * val) * 100) / 100);
              }} 
              style={{ width: '100%' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ color: '#475569' }}>Aylık Fatura Tutarı</span>
              <span style={{ fontWeight: 'bold' }}>{monthlyCharges} $</span>
            </div>
            <input 
              type="range" 
              min="18" 
              max="120" 
              value={monthlyCharges} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleInputChange(setMonthlyCharges, val, 'monthlyCharges');
                setTotalCharges(Math.round((val * tenure) * 100) / 100);
              }} 
              style={{ width: '100%' }} 
            />
          </div>

          <button 
            onClick={handleGenerateRecommendation}
            style={{ 
              width: '100%', marginTop: '12px', backgroundColor: '#0f172a', color: 'white', 
              border: 'none', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Activity size={16} color="#38bdf8" /> Mevcut Durumu Analiz Et ve Aksiyon Planı Hazırla
          </button>
        </div>

        {/* Sağ Panel: Tahmin Çıktısı & Grafik */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{
                width: '130px', height: '130px', borderRadius: '50%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '5px solid', textAlign: 'center', flexShrink: 0, transition: 'all 0.3s ease',
                ...getRiskStyle(riskScore)
              }}>
                <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Kayıp Riski</span>
                <span style={{ fontSize: '32px', fontWeight: '800' }}>%{riskScore}</span>
              </div>
              
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BarChart2 size={16} />Karar Gerekçeleri
                </h3>
                {factors.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Hazır kayıtlı senaryo yüklerinde gerekçeler gizlenir.</p>
                ) : (
                  factors.map((f, i) => {
                    const factorWidth = riskScore > 0 ? Math.min(100, (f.value / riskScore) * 100) : 0;
                    return (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginRight: '8px' }}>{f.name}</span>
                          <span style={{ fontWeight: '500', flexShrink: 0 }}>+{f.value}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${factorWidth}%`, backgroundColor: '#475569', height: '100%', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 10px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={16} /> Gelecek Dönem Sadakat & Risk Projeksiyonu
            </h3>
            <div style={{ width: '100%', height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Risk" stroke="#38bdf8" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Aksiyon Öneri Alanı */}
      {activeRecommendation && (
        <div style={{ backgroundColor: '#ffffff', borderTop: '4px solid #0f172a', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lightbulb size={20} color="#eab308" /> {activeRecommendation.title}
          </h3>
          
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            {activeRecommendation.desc}
          </p>

          {previewResultText && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
              {previewResultText}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => { setActiveRecommendation(null); setPreviewResultText(""); }} style={{ backgroundColor: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Kapat
            </button>
            {activeRecommendation.actionType !== "none" && !previewResultText && (
              <button onClick={applyAndPreviewAction} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlayCircle size={16} /> Uygula ve Önizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Kayıtlı Kurumsal Senaryolar */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
          Kayıtlı Kurumsal Senaryolar
        </h3>
        {savedScenarios.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center', paddingTop: '10px' }}>
            Veritabanında henüz kayıtlı senaryo bulunamadı.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '8px 4px' }}>Senaryo Adı</th>
                <th style={{ padding: '8px 4px' }}>Sözleşme</th>
                <th style={{ padding: '8px 4px' }}>Sadakat Süresi</th>
                <th style={{ padding: '8px 4px' }}>Aylık Fatura</th>
                <th style={{ padding: '8px 4px' }}>Kayıp Riski</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '90px' }}>Görüntüle</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '60px' }}>Sil</th>
              </tr>
            </thead>
            <tbody>
              {savedScenarios.map((s, index) => {
                const rowKey = s.id || index;
                return (
                  <tr key={rowKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 4px', fontWeight: '600', color: '#0f172a' }}>{s.name}</td>
                    <td style={{ padding: '10px 4px' }}>{s.contract}</td>
                    <td style={{ padding: '10px 4px' }}>{s.tenure} Ay</td>
                    <td style={{ padding: '10px 4px' }}>{s.monthly} $</td>
                    <td style={{ padding: '10px 4px', fontWeight: 'bold', color: s.score > 50 ? '#ef4444' : '#16a34a' }}>%{s.score}</td>
                    <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                      <button 
                        type="button"
                        onClick={() => loadSelectedScenario(s)}
                        style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Görüntüle
                      </button>
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                      <button type="button" onClick={() => deleteScenarioFromDB(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* İsimlendirme Modalı */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
              Senaryoyu Kaydet
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Senaryo Adı
              </label>
              <input 
                type="text"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                İptal
              </button>
              <button onClick={executeSaveScenario} style={{ backgroundColor: '#2563eb', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
