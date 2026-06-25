import React, { useState, useEffect } from 'react';
import { Users, Activity, Save, Trash2, TrendingUp, BarChart2, Lightbulb, PlayCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [gender, setGender] = useState(0);
  const [seniorCitizen, setSeniorCitizen] = useState(0);
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

  const fetchRiskPrediction = async (customParams = null) => {
    const payload = customParams ? customParams : {
      gender: parseInt(gender),
      SeniorCitizen: parseInt(seniorCitizen),
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
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        if (!customParams) {
          setRiskScore(data.churn_probability);
          setFactors(data.risk_factors || []);
        }
        return data;
      }
    } catch (error) {
      console.error("Tahmin API hatası:", error);
    }
    return null;
  };

  const loadScenariosFromDB = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/scenarios');
      if (response.ok) {
        const data = await response.json();
        setSavedScenarios(data);
      }
    } catch (error) {
      console.error("Senaryo yükleme hatası:", error);
    }
  };

  useEffect(() => {
    fetchRiskPrediction();
  }, [gender, seniorCitizen, tenure, monthlyCharges, totalCharges, contract, internetService]);

  useEffect(() => {
    loadScenariosFromDB();
  }, []);

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

  const loadSelectedScenario = (scenario) => {
    setContract(scenario.contract);
    setInternetService(scenario.internetService);
    setTenure(parseInt(scenario.tenure));
    setMonthlyCharges(parseFloat(scenario.monthly));
    
    setGender(parseInt(scenario.gender || 0));
    setSeniorCitizen(parseInt(scenario.seniorCitizen || 0));
    
    const calculatedTotal = Math.round((parseFloat(scenario.monthly) * parseInt(scenario.tenure)) * 100) / 100;
    setTotalCharges(calculatedTotal);
    setRiskScore(parseFloat(scenario.score));
    
    setActiveRecommendation(null);
    setPreviewResultText("");
  };

  const deleteScenarioFromDB = async (id) => {
    if (!confirm("Bu senaryoyu silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/scenarios/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadScenariosFromDB();
      }
    } catch (error) {
      console.error("Senaryo silme hatası:", error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <h2>Müşteri Kayıp Risk Analitiği Karar Destek Sistemi</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        
        {/* Sol Panel: Kontroller */}
        <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Simülasyon Kriterleri</h3>
          
          <label style={{ display: 'block', marginTop: '10px' }}>Cinsiyet</label>
          <select value={gender} onChange={(e) => setGender(parseInt(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value={0}>Kadın</option>
            <option value={1}>Erkek</option>
          </select>

          <label style={{ display: 'block', marginTop: '10px' }}>65 Yaş Üstü Müşteri</label>
          <select value={seniorCitizen} onChange={(e) => setSeniorCitizen(parseInt(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value={0}>Hayır</option>
            <option value={1}>Evet</option>
          </select>

          <label style={{ display: 'block', marginTop: '10px' }}>Abonelik Süresi (Ay): {tenure}</label>
          <input type="range" min="1" max="72" value={tenure} onChange={(e) => setTenure(parseInt(e.target.value))} style={{ width: '100%' }} />

          <label style={{ display: 'block', marginTop: '10px' }}>Aylık Ücret ($)</label>
          <input type="number" value={monthlyCharges} onChange={(e) => setMonthlyCharges(parseFloat(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />

          <label style={{ display: 'block', marginTop: '10px' }}>Sözleşme Tipi</label>
          <select value={contract} onChange={(e) => setContract(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value="Month-to-month">Aydan Aya</option>
            <option value="One year">1 Yıllık</option>
            <option value="Two year">2 Yıllık</option>
          </select>

          <label style={{ display: 'block', marginTop: '10px' }}>İnternet Servis Tipi</label>
          <select value={internetService} onChange={(e) => setInternetService(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value="DSL">DSL</option>
            <option value="Fiber optic">Fiber Optik</option>
            <option value="No">İnternet Yok</option>
          </select>

          <button onClick={saveScenarioToDB} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Save size={16} /> Senaryoyu Kaydet
          </button>
        </div>

        {/* Sağ Panel: Sonuçlar */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Kayıp (Churn) Risk Skoru</h3>
            <h1 style={{ color: riskScore >= 50 ? '#dc2626' : '#16a34a', fontSize: '48px', margin: '10px 0' }}>%{riskScore.toFixed(1)}</h1>
          </div>

          {/* Kayıtlı Senaryolar Tablosu */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Kayıtlı Senaryolar Analiz Geçmişi</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Senaryo Adı</th>
                  <th style={{ padding: '8px' }}>Sözleşme</th>
                  <th style={{ padding: '8px' }}>Aylık Ücret</th>
                  <th style={{ padding: '8px' }}>Risk Skoru</th>
                  <th style={{ padding: '8px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {savedScenarios.map((scen) => (
                  <tr key={scen.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>{scen.name}</td>
                    <td style={{ padding: '8px' }}>{scen.contract}</td>
                    <td style={{ padding: '8px' }}>${scen.monthly}</td>
                    <td style={{ padding: '8px', color: scen.score >= 50 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>%{scen.score}</td>
                    <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                      <button onClick={() => loadSelectedScenario(scen)} style={{ padding: '4px 8px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Görüntüle</button>
                      <button onClick={() => deleteScenarioFromDB(scen.id)} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Kayıt Modalı */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '400px' }}>
            <h3>Senaryoyu Kaydet</h3>
            <input type="text" value={newScenarioName} onChange={(e) => setNewScenarioName(e.target.value)} style={{ width: '100%', padding: '8px', margin: '15px 0', boxSizing: 'border-box' }} placeholder="Senaryo ismi girin" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px 12px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>İptal</button>
              <button onClick={executeSaveScenario} style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;