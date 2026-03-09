📁 Project Root
├── Frontend (React)
│   ├── public/
│   │   └── ATS_LOGO1.png (The company logo used in the sidebar and login screen)
│   ├── src/
│   │   ├── main.jsx (The React entry point that renders your App)
│   │   ├── index.css (Contains your Tailwind CSS imports and global styles)
│   │   ├── App.jsx (The central nervous system: handles routing, authentication state, and fetches the /api/dashboard data)
│   │   └── pages/
│   │       ├── login.jsx (The authentication screen protecting the portal)
│   │       ├── Dashboard.jsx (The main view rendering the 8 KPI cards, Funnel, Pie Chart, and Top Agents)
│   │       ├── ATSboard.jsx (The Applicant Tracking Table with server-side pagination fetching 100 rows at a time)
│   │       ├── PaymentCurve.jsx (The dedicated Recharts component for the collection decay curve)
│   │       └── Profile.jsx (The Admin Profile settings page)
                AIBot.jsx(this stores the AIbot setting page)
│
├── Backend (FastAPI & Python)
│   └── main.py (The powerhouse of your application. Contains the SQLAlchemy database connection, the Pandas chunking ETL engine, and your 5 API endpoints)
│
└── Database (PostgreSQL)
└── bfsi_portal (Running locally via pgAdmin 4)
└── allocations (The single massive table holding all 86,650+ cleaned rows of data)


FOR DETAILS 

"I architected and built a decoupled, full-stack Collection Performance Tracking Dashboard.
It features a React frontend, a FastAPI backend acting as an ETL pipeline, and a PostgreSQL
database to handle large-scale financial data. To solve memory constraints with massive 
86,000+ row datasets, I implemented chunked database uploading and server-side pagination. 
Finally, I integrated a custom Text-to-SQL AI Agent using Groq's Llama 3.3 model, allowing
managers to query the database using natural English without writing any code."



Phase 1: The Frontend Foundation (React & Tailwind)
What you built: A scalable, component-based user interface.

Routing & Structure: You used react-router-dom to create a multi-page application (Main Dashboard, ATS Tracking, Payment Curve, Ask AI, and Admin Profile).

Modern UI/UX: You designed a dark-mode, professional financial interface using Tailwind CSS grid layouts, ensuring it looks like high-end BFSI software.

Dynamic Visualizations: You integrated Recharts to build Ageing Funnels, Policy Status Pie Charts, and Payment Curves that automatically re-render when the data changes.

Custom Financial Formatting: You wrote a custom JavaScript engine to intelligently format massive raw numbers into readable Indian currency metrics (e.g., converting 3780000000 to ₹378.00 Cr).

Phase 2: The Big Data ETL Pipeline (FastAPI, Pandas, PostgreSQL)
What you built: The ingestion engine. This is where you solved the hardest engineering problem: preventing the server from crashing when uploading massive CSV files.

Smart Pruning: Instead of dumping 48 messy columns into the database, you wrote a Pandas script to strictly filter the data, keeping only the 12 core columns actually needed for analytics (like OUTSTANDING_PREMIUM, PROPENSITY, and STATE).

Data Cleaning: You built Python functions to automatically strip commas, spaces, and NaN values from messy strings, converting them into pure, calculable floats.

Memory-Safe Chunking: Instead of loading an 86,650-row file entirely into RAM (which causes crashes), you programmed Pandas to stream the data into PostgreSQL in manageable chunks (chunksize=90000).

Phase 3: The "Two-Lane" API Architecture
What you built: A highly optimized way to serve data to the frontend without freezing the browser.

Lane 1 (Heavy Aggregation): The /api/dashboard endpoint queries the entire database, does the heavy mathematical lifting in Python (calculating total outstanding, grouping high-risk volumes), and sends a tiny, pre-calculated JSON package to the React graphs.

Lane 2 (Server-Side Pagination): Rendering 86,000 table rows will crash Google Chrome. You built the /api/policies endpoint using SQL LIMIT and OFFSET commands. This ensures React only ever requests and displays 100 rows at a time, keeping the application lightning-fast.

Phase 4: The AI "Text-to-SQL" Agent (Groq & Llama 3.3)
What you built: You bypassed basic keyword-matching and built a true AI database analyst.

Schema Injection: Instead of feeding the AI all 86,000 rows (which is impossible/expensive), you feed the Groq API your exact PostgreSQL schema.

Natural Language Translation: When a manager types, "What is the total outstanding premium for Lapse policies in the North zone?", Llama 3.3 translates that English into a perfect, case-sensitive SQL query.

Secure Execution: Your Python backend takes that SQL, safely executes it against PostgreSQL using SQLAlchemy, retrieves the exact mathematical result, and passes it back to the AI to format into a conversational sentence.