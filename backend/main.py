from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text  
import math
import re
import os
from groq import Groq
app = FastAPI(title="ATS & BFSI Collections API", version="1.0")

# --- DATABASE CONNECTION ---
# Change 'YOUR_PASSWORD_HERE' to your actual postgres password

engine = create_engine(DB_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str
@app.post("/api/login")
async def login(request: LoginRequest):
    if request.username == "admin" and request.password == "Manit@2026":
        return {"status": "success", "token": "manit-secure-session-2026"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

def clean_currency(x):
    if isinstance(x, str):
        x = x.replace(',', '').replace(' ', '').replace('"', '')
        try:
            return float(x)
        except ValueError:
            return 0.0
    elif math.isnan(x):
        return 0.0
    return float(x)

@app.post("/api/collections/upload-allocation")
async def upload_allocation_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    try:
        # 1. STREAM DATA INTO POSTGRES IN CHUNKS (Prevents Memory Crash)
        # 1. STREAM DATA INTO POSTGRES IN CHUNKS
        chunk_size = 90000
        is_first_chunk = True
        
        # The exact columns our React Dashboard actually needs
        core_columns = [
            'CUST_ID', 'PAID_TO_DATE', 'OUTSTANDING_PREMIUM', 
            'POLICY_PAYING_TERM', 'POLICY_STATUS', 'PRODUCT_NAME',
            'LAPSE_AGEING', 'PROPENSITY', 'AMOUNT_IN_SUSPENCE', 
            'INTEREST_CHARGED', 'POLICY_SOURCE_CODE'
        ]
        
        for chunk in pd.read_csv(file.file, chunksize=chunk_size, low_memory=False):
            
            # Ensure all core columns exist (prevents KeyError if CSV changes slightly)
            for col in core_columns:
                if col not in chunk.columns:
                    chunk[col] = None
                    
            # PRUNE: Discard the other 37 useless columns
            chunk = chunk[core_columns]

            # Clean the financial columns
            cols_to_clean = ['OUTSTANDING_PREMIUM', 'AMOUNT_IN_SUSPENCE', 'INTEREST_CHARGED']
            for col in cols_to_clean:
                chunk[col] = chunk[col].apply(clean_currency)
                    
            # Clean the text/numeric columns
            chunk['LAPSE_AGEING'] = pd.to_numeric(chunk['LAPSE_AGEING'], errors='coerce').fillna(0)
            chunk['PROPENSITY'] = chunk['PROPENSITY'].fillna('Unknown')
            chunk['PAID_TO_DATE'] = chunk['PAID_TO_DATE'].fillna("N/A")
            chunk['POLICY_PAYING_TERM'] = pd.to_numeric(chunk['POLICY_PAYING_TERM'], errors='coerce').fillna(0)
            chunk['POLICY_STATUS'] = chunk['POLICY_STATUS'].fillna('Unknown')
            chunk['PRODUCT_NAME'] = chunk['PRODUCT_NAME'].fillna('Unknown')
            chunk['POLICY_SOURCE_CODE'] = chunk['POLICY_SOURCE_CODE'].fillna('Unknown')
            
            # Save to Postgres
            if is_first_chunk:
                chunk.to_sql('allocations', engine, if_exists='replace', index=False)
                is_first_chunk = False
            else:
                chunk.to_sql('allocations', engine, if_exists='append', index=False)
                
            print(f"Successfully inserted chunk into PostgreSQL...")
        # 2. QUERY THE DATABASE FOR ANALYTICS
        # Now that data is safely in Postgres, we query it. 
        # (For true Big Data, these would be SQL queries, but reading via Pandas is fast for this intermediate step)
        df = pd.read_sql("SELECT * FROM allocations", engine)

        # Calculate KPIs
        total_outstanding = float(df['OUTSTANDING_PREMIUM'].sum())
        high_risk_volume = float(df[df['LAPSE_AGEING'] > 180]['OUTSTANDING_PREMIUM'].sum())
        avg_ticket_size = float(df['OUTSTANDING_PREMIUM'].mean())
        amount_in_suspense = float(df['AMOUNT_IN_SUSPENCE'].sum() if 'AMOUNT_IN_SUSPENCE' in df.columns else 0)
        interest_charged = float(df['INTEREST_CHARGED'].sum() if 'INTEREST_CHARGED' in df.columns else 0)
        high_prop_target = float(df[df['PROPENSITY'].isin(['A.HIGH', 'GT5L'])]['OUTSTANDING_PREMIUM'].sum())
        recovered_policies = int((df['POLICY_STATUS'] == 'Paid up').sum())

        # Calculate Ageing Funnel
        bins = [-1, 30, 90, 180, 999999]
        labels = ['0-30 Days', '31-90 Days', '91-180 Days', '180+ Days']
        df['Ageing_Bucket'] = pd.cut(df['LAPSE_AGEING'], bins=bins, labels=labels)
        
        funnel_data = []
        for bucket in labels:
            bucket_df = df[df['Ageing_Bucket'] == bucket]
            funnel_data.append({
                "name": bucket,
                "High": round(float(bucket_df[bucket_df['PROPENSITY'].isin(['A.HIGH', 'GT5L'])]['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Medium": round(float(bucket_df[bucket_df['PROPENSITY'] == 'B.MEDIUM']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Low": round(float(bucket_df[bucket_df['PROPENSITY'] == 'C.LOW']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2)
            })

        # Calculate Payment Curve
        curve_bins = [-1, 15, 30, 60, 90, 180, 365, 9999]
        curve_labels = ['0-15', '16-30', '31-60', '61-90', '91-180', '181-365', '365+']
        df['Curve_Bucket'] = pd.cut(df['LAPSE_AGEING'], bins=curve_bins, labels=curve_labels)
        
        payment_curve = []
        for bucket in curve_labels:
            bucket_df = df[df['Curve_Bucket'] == bucket]
            payment_curve.append({
                "time": f"{bucket} Days",
                "High_Propensity": round(float(bucket_df[bucket_df['PROPENSITY'].isin(['A.HIGH', 'GT5L'])]['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Medium_Propensity": round(float(bucket_df[bucket_df['PROPENSITY'] == 'B.MEDIUM']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Low_Propensity": round(float(bucket_df[bucket_df['PROPENSITY'] == 'C.LOW']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2)
            })

        # Policy Status Pie Chart
        status_counts = df['POLICY_STATUS'].value_counts().reset_index()
        status_color_map = {'Due': '#f59e0b', 'Paid up': '#22c55e', 'Lapse': '#ef4444', 'Discoutiue': '#64748b'}
        status_data = [{"name": str(row['POLICY_STATUS']), "value": int(row['count']), "color": status_color_map.get(str(row['POLICY_STATUS']), '#3b82f6')} for _, row in status_counts.iterrows()]

        # Top Agents
        agent_group = df.groupby('POLICY_SOURCE_CODE').agg(outstanding=('OUTSTANDING_PREMIUM', 'sum'), policies=('POLICY', 'count')).reset_index().sort_values('outstanding', ascending=False).head(4)
        colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500']
        top_agents = [{"code": str(row.POLICY_SOURCE_CODE), "amount": f"₹{(row.outstanding / 1000000):.2f}M", "policies": str(row.policies), "color": colors[i % 4]} for i, row in enumerate(agent_group.itertuples())]

        return {
            "status": "success",
            "kpis": {
                "total_policies": len(df),
                "total_outstanding": total_outstanding,
                "high_risk_volume": high_risk_volume,
                "avg_ticket_size": avg_ticket_size,
                "amount_in_suspense": amount_in_suspense,
                "interest_charged": interest_charged,
                "high_prop_target": high_prop_target,
                "recovered_policies": recovered_policies
            },
            "funnel": funnel_data,
            "policy_status_pie": status_data,
            "agents": top_agents,
            "payment_curve": payment_curve
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# --- 4. NEW PAGINATION ENDPOINT FOR THE TABLE ---
@app.get("/api/policies")
async def get_policies(page: int = 1, limit: int = 100):
    try:
        offset = (page - 1) * limit
        # This SQL query grabs ONLY 100 rows at a time directly from PostgreSQL
        query = f"""
            SELECT "CUST_ID", "PAID_TO_DATE", "OUTSTANDING_PREMIUM", 
                   "POLICY_PAYING_TERM", "POLICY_STATUS", "PRODUCT_NAME" 
            FROM allocations 
            ORDER BY "OUTSTANDING_PREMIUM" DESC 
            LIMIT {limit} OFFSET {offset}
        """
        table_df = pd.read_sql(query, engine)
        
        # Count total rows for frontend pagination math
        total_rows = pd.read_sql("SELECT COUNT(*) FROM allocations", engine).iloc[0,0]
        
        return {
            "status": "success",
            "data": table_df.to_dict(orient='records'),
            "total_records": int(total_rows),
            "total_pages": math.ceil(total_rows / limit),
            "current_page": page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW DASHBOARD ENDPOINT ---
@app.get("/api/dashboard")
async def get_dashboard_data():
    try:
        # 1. Grab all data from PostgreSQL
        df = pd.read_sql("SELECT * FROM allocations", engine)
        
        # If the database is empty (no uploads yet)
        if df.empty:
            return {"status": "empty"}

        # 2. Calculate KPIs
        total_outstanding = float(df['OUTSTANDING_PREMIUM'].sum())
        high_risk_volume = float(df[df['LAPSE_AGEING'] > 180]['OUTSTANDING_PREMIUM'].sum())
        avg_ticket_size = float(df['OUTSTANDING_PREMIUM'].mean())
        amount_in_suspense = float(df['AMOUNT_IN_SUSPENCE'].sum() if 'AMOUNT_IN_SUSPENCE' in df.columns else 0)
        interest_charged = float(df['INTEREST_CHARGED'].sum() if 'INTEREST_CHARGED' in df.columns else 0)
        high_prop_target = float(df[df['PROPENSITY'].isin(['A.HIGH', 'GT5L'])]['OUTSTANDING_PREMIUM'].sum())
        recovered_policies = int((df['POLICY_STATUS'] == 'Paid up').sum())

        # 3. Calculate Ageing Funnel
        bins = [-1, 30, 90, 180, 999999]
        labels = ['0-30 Days', '31-90 Days', '91-180 Days', '180+ Days']
        df['Ageing_Bucket'] = pd.cut(df['LAPSE_AGEING'], bins=bins, labels=labels)
        
        funnel_data = []
        for bucket in labels:
            bucket_df = df[df['Ageing_Bucket'] == bucket]
            funnel_data.append({
                "name": bucket,
                "High": round(float(bucket_df[bucket_df['PROPENSITY'].isin(['A.HIGH', 'GT5L'])]['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Medium": round(float(bucket_df[bucket_df['PROPENSITY'] == 'B.MEDIUM']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Low": round(float(bucket_df[bucket_df['PROPENSITY'] == 'C.LOW']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2)
            })

        # 4. Calculate Payment Curve
        curve_bins = [-1, 15, 30, 60, 90, 180, 365, 9999]
        curve_labels = ['0-15', '16-30', '31-60', '61-90', '91-180', '181-365', '365+']
        df['Curve_Bucket'] = pd.cut(df['LAPSE_AGEING'], bins=curve_bins, labels=curve_labels)
        
        payment_curve = []
        for bucket in curve_labels:
            bucket_df = df[df['Curve_Bucket'] == bucket]
            payment_curve.append({
                "time": f"{bucket} Days",
                "High_Propensity": round(float(bucket_df[bucket_df['PROPENSITY'].isin(['A.HIGH', 'GT5L'])]['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Medium_Propensity": round(float(bucket_df[bucket_df['PROPENSITY'] == 'B.MEDIUM']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2),
                "Low_Propensity": round(float(bucket_df[bucket_df['PROPENSITY'] == 'C.LOW']['OUTSTANDING_PREMIUM'].sum() or 0) / 1000000, 2)
            })

        # 5. Policy Status Pie Chart
        status_counts = df['POLICY_STATUS'].value_counts().reset_index()
        status_color_map = {'Due': '#f59e0b', 'Paid up': '#22c55e', 'Lapse': '#ef4444', 'Discoutiue': '#64748b'}
        status_data = [{"name": str(row['POLICY_STATUS']), "value": int(row['count']), "color": status_color_map.get(str(row['POLICY_STATUS']), '#3b82f6')} for _, row in status_counts.iterrows()]

        # 6. Top Agents
        agent_group = df.groupby('POLICY_SOURCE_CODE').agg(outstanding=('OUTSTANDING_PREMIUM', 'sum'), policies=('CUST_ID', 'count')).reset_index().sort_values('outstanding', ascending=False).head(4)
        colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500']
        top_agents = [{"code": str(row.POLICY_SOURCE_CODE), "amount": f"₹{(row.outstanding / 1000000):.2f}M", "policies": str(row.policies), "color": colors[i % 4]} for i, row in enumerate(agent_group.itertuples())]

        return {
            "status": "success",
            "kpis": {
                "total_policies": len(df),
                "total_outstanding": total_outstanding,
                "high_risk_volume": high_risk_volume,
                "avg_ticket_size": avg_ticket_size,
                "amount_in_suspense": amount_in_suspense,
                "interest_charged": interest_charged,
                "high_prop_target": high_prop_target,
                "recovered_policies": recovered_policies
            },
            "funnel": funnel_data,
            "policy_status_pie": status_data,
            "agents": top_agents,
            "payment_curve": payment_curve
        }
    except Exception as e:
        print(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 5. GROQ-POWERED TEXT-TO-SQL AI BOT ---
# Replace with your actual Groq API key
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

class ChatQuery(BaseModel):
    question: str

@app.post("/api/ask-ai")
async def ask_ai(query: ChatQuery):
    user_question = query.question
    
    # 1. Provide the exact columns we preserved during our Pandas cleaning phase
    database_schema = """
    Table: allocations
    Columns: 
    - CUST_ID (string)
    - PAID_TO_DATE (string)
    - OUTSTANDING_PREMIUM (numeric)
    - POLICY_PAYING_TERM (numeric)
    - POLICY_STATUS (string: 'Lapse', 'Paid up', 'Due', 'Discoutiue')
    - PRODUCT_NAME (string)
    - LAPSE_AGEING (numeric: days past due)
    - PROPENSITY (string: 'A.HIGH', 'B.MEDIUM', 'C.LOW', 'GT5L')
    - AMOUNT_IN_SUSPENCE (numeric)
    - INTEREST_CHARGED (numeric)
    - POLICY_SOURCE_CODE (string)
    - STATE (string)
    """
    
    try:
        # --- CALL 1: Translate English to SQL ---
        sql_prompt = f"""
        You are a senior PostgreSQL data engineer. Based on this schema:
        {database_schema}
        
        CRITICAL RULES:
        1. All column names MUST be wrapped in double quotes (e.g., "OUTSTANDING_PREMIUM", "STATE").
        2. If the user asks about a geographic region (like "North Zone"), use the "STATE" column. Do not invent columns.
        3. You must ONLY return the raw SQL. Do not include markdown tags (like ```sql), and do not say "Here is the query".
        
        Write a valid PostgreSQL query for this question: "{user_question}"
        """
        
        sql_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[{"role": "user", "content": sql_prompt}],
            temperature=0
        )
        
        # Clean up the AI output aggressively to ensure it's pure SQL
        raw_sql = sql_response.choices[0].message.content.strip()
        raw_sql = raw_sql.replace("```sql", "").replace("```", "").replace("\n", " ").strip()
        
        print("\n" + "="*40)
        print(f"🤖 AI WROTE THIS SQL: {raw_sql}")
        print("="*40 + "\n")
        
        # --- EXECUTION: Run the SQL against PostgreSQL ---
        with engine.connect() as connection:
            result_df = pd.read_sql(text(raw_sql), connection)
            
        query_result = str(result_df.to_dict('records'))
        
        print("\n" + "="*40)
        print(f"📊 DATABASE RETURNED: {query_result}")
        print("="*40 + "\n")
        
        # --- CALL 2: Translate Data back to English ---
        answer_prompt = f"""
        The manager asked: "{user_question}"
        The database returned this raw data: {query_result}
        Write a short, professional business sentence answering the user's question using the data.
        If the data is a monetary value, format it nicely with commas and a ₹ symbol.
        """
        
        final_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[{"role": "user", "content": answer_prompt}],
            temperature=0.3
        )
        
        return {"answer": final_response.choices[0].message.content.strip()}
        
    except Exception as e:
        # If it crashes, print the EXACT reason to the terminal
        print("\n" + "!"*40)
        print(f"🚨 FATAL ERROR: {str(e)}")
        print("!"*40 + "\n")
        
        return {"answer": "I hit a database error. Please check your VS Code terminal for the exact 'FATAL ERROR' message!"}