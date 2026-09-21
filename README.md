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