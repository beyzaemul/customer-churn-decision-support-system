from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import pandas as pd
import sqlite3

app = FastAPI(title="Enterprise Customer Churn Decision Support System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect('scenarios.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_scenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contract TEXT,
            internetService TEXT,
            tenure INTEGER,
            monthly REAL,
            score REAL,
            gender INTEGER DEFAULT 0,
            seniorCitizen INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_db()

with open('churn_model.pkl', 'rb') as file:
    model = pickle.load(file)

with open('model_columns.pkl', 'rb') as file:
    model_columns = pickle.load(file)

class CustomerSimulationData(BaseModel):
    gender: int
    SeniorCitizen: int
    tenure: int
    MonthlyCharges: float
    TotalCharges: float
    Contract: str          
    InternetService: str   

class ScenarioSaveData(BaseModel):
    name: str
    contract: str
    internetService: str
    tenure: int
    monthly: float
    score: float
    gender: int
    seniorCitizen: int

@app.post("/api/v1/predict")
def predict_risk(data: CustomerSimulationData):
    input_data = data.model_dump()
    
    encoded_data = {col: 0 for col in model_columns}
    for key in ['gender', 'SeniorCitizen', 'tenure', 'MonthlyCharges', 'TotalCharges']:
        if key in encoded_data:
            encoded_data[key] = input_data[key]
            
    contract_key = f"Contract_{input_data['Contract']}"
    if contract_key in encoded_data:
        encoded_data[contract_key] = 1
    elif contract_key.replace(" ", "_") in encoded_data:
        encoded_data[contract_key.replace(" ", "_")] = 1
        
    internet_key = f"InternetService_{input_data['InternetService']}"
    if internet_key in encoded_data:
        encoded_data[internet_key] = 1
    elif internet_key.replace(" ", "_") in encoded_data:
        encoded_data[internet_key.replace(" ", "_")] = 1

    df_input = pd.DataFrame([encoded_data], columns=model_columns)
    
    risk_probability = model.predict_proba(df_input)[0][1]
    risk_score = round(float(risk_probability) * 100, 2)
    
    fatura_etkisi = min(40, int((input_data['MonthlyCharges'] / 120) * 40))
    sadakat_etkisi = max(5, int(40 - (input_data['tenure'] / 72) * 40))
    sozlesme_etkisi = 35 if input_data['Contract'] == "Month-to-month" else (15 if input_data['Contract'] == "One year" else 5)
    internet_etkisi = 25 if input_data['InternetService'] == "Fiber optic" else 10
    
    toplam_agirlik = fatura_etkisi + sadakat_etkisi + sozlesme_etkisi + internet_etkisi
    
    faktorler = [
        {"name": "Yüksek Fatura Yükü", "value": round((fatura_etkisi / toplam_agirlik) * risk_score, 1)},
        {"name": "Düşük Müşteri Sadakati (Tenure)", "value": round((sadakat_etkisi / toplam_agirlik) * risk_score, 1)},
        {"name": "Kısa Dönemli Sözleşme Riski", "value": round((sozlesme_etkisi / toplam_agirlik) * risk_score, 1)},
        {"name": "Hizmet Tipi Etkisi", "value": round((internet_etkisi / toplam_agirlik) * risk_score, 1)}
    ]
    
    return {"risk_score": risk_score, "factors": faktorler, "status": "Success"}

@app.post("/api/v1/scenarios")
def save_scenario(scen: ScenarioSaveData):
    conn = sqlite3.connect('scenarios.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO saved_scenarios (name, contract, internetService, tenure, monthly, score, gender, seniorCitizen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (scen.name, scen.contract, scen.internetService, scen.tenure, scen.monthly, scen.score, scen.gender, scen.seniorCitizen))
    conn.commit()
    conn.close()
    return {"status": "Success", "message": "Senaryo başarıyla veritabanına kaydedildi."}

@app.get("/api/v1/scenarios")
def get_scenarios():
    conn = sqlite3.connect('scenarios.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, contract, internetService, tenure, monthly, score, gender, seniorCitizen FROM saved_scenarios ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    
    scenarios_list = []
    for r in rows:
        scenarios_list.append({
            "id": r[0], "name": r[1], "contract": r[2], "internetService": r[3],
            "tenure": r[4], "monthly": r[5], "score": r[6], "gender": r[7], "seniorCitizen": r[8]
        })
    return scenarios_list

@app.delete("/api/v1/scenarios/{scenario_id}")
def delete_scenario(scenario_id: int):
    conn = sqlite3.connect('scenarios.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM saved_scenarios WHERE id = ?', (scenario_id,))
    conn.commit()
    conn.close()
    return {"status": "Success", "message": "Senaryo veritabanından silindi."}

@app.get("/")
def health_check():
    return {"status": "Decision Support API Gateway Online + Database Integrated"}