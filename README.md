# HUMAITEC AI POS with FBR Integration

A full-stack Point of Sale (POS) system built with React, FastAPI, PostgreSQL, and SQLAlchemy.

The system manages products, creates sales, updates inventory, submits mock FBR invoices, and forecasts product demand from previous sales data.



## Features

- Product inventory management
  - Add products
  - Edit products
  - Delete products not linked to a sale
  - Low-stock indicator

- POS checkout
  - Create sales
  - Reduce stock automatically
  - Generate sale receipt
  - Support cash, card, and online payments

- Sales history
  - View completed sales
  - See payment method, amount, and date

- Mock FBR invoices
  - Submit a completed sale to the Mock FBR service
  - Generate a mock invoice number
  - Track invoice status
  - Retry failed mock invoice submissions

- AI sales forecasting
  - Predict next-day product demand
  - Uses available POS sales history
  - Uses Linear Regression when enough history is available

- React dashboard
  - Total products
  - Low-stock products
  - Total sales
  - Latest Mock FBR status

## Technology Stack

### Backend

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pydantic
- Scikit-learn
- Pandas

### Frontend

- React
- Vite
- JavaScript
- CSS

## Project Structure

```text
humaitec-ai-pos-fbr/
├── app/
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── frontend/
│   ├── src/
│   └── package.json
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md


```


## Backend Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Open FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the React frontend:

```text
http://localhost:5173
```

## Demo Flow

1. Add products from the **Products** page.
2. Create a sale from **Checkout**.
3. Check that inventory stock decreases.
4. View completed sales on the **Sales** page.
5. Submit a sale from **FBR Invoices** to Mock FBR.
6. View next-day demand on **AI Forecast**.