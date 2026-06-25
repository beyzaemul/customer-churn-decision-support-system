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
def predict_churn(data: CustomerSimulationData):
    input_data = {
        'gender': [data.gender],
        'SeniorCitizen': [data.SeniorCitizen],
        'tenure': [data.tenure],
        'MonthlyCharges': [data.MonthlyCharges],
        'TotalCharges': [data.TotalCharges],
        'Contract_Month-to-month': [1 if data.Contract == "Month-to-month" else 0],
        'Contract_One year': [1 if data.Contract == "One year" else 0],
        'Contract_Two year': [1 if data.Contract == "Two year" else 0],
        'InternetService_DSL': [1 if data.InternetService == "DSL" else 0],
        'InternetService_Fiber optic': [1 if data.InternetService == "Fiber optic" else 0],
        'InternetService_No': [1 if data.InternetService == "No" else 0]
    }
    
    X_input = pd.DataFrame(input_data)
    X_input = X_input.reindex(columns=model_columns, fill_value=0)
    
    prob = model.predict_proba(X_input)[0][1]
    prob_percentage = round(float(prob) * 100, 2)
    
    factors = []
    if data.Contract == "Month-to-month":
        factors.append("Aydan aya sözleşme tipi kayıp riskini artırıyor.")
    if data.InternetService == "Fiber optic":
        factors.append("Fiber optik hat kullanan müşterilerde genel şikayet oranı yüksek.")
    if data.tenure < 6:
        factors.append("Yeni müşterilerin ilk 6 ayda ayrılma eğilimi yüksektir.")
        
    return {
        "churn_probability": prob_percentage,
        "risk_factors": factors
    }

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
    return {"status": "Success", "message": "Senaryo başarıyla silindi."}

@app.get("/")
def health_check():
    return {"status": "healthy", "message": "API tıkır tıkır çalışıyor."}