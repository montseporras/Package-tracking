# Clínica Mottura — Order Management

Web application developed to **centralize the management and tracking of Clínica Mottura's orders**.

It allows users to register orders, check their status, apply filters, view key metrics, and keep a history of status changes through a simple, modern, and responsive interface.

## Main Features

* Dashboard with a general overview of orders.
* Create, edit, view, duplicate, and delete orders.
* Order tracking by status: **Pending**, **In Transit**, and **Received**.
* Status change history with date and time.
* Search by order number, supplier, company, or description.
* Filters by status, country, company, supplier, date, price, and Sworn Declaration.
* Order sorting by different fields.
* Sworn Declaration management.
* Support for amounts in **USD** and **ARS**.
* Form validations and confirmation messages.
* Responsive design for desktop, tablet, and mobile devices.
* Light and dark mode.

---

## Tech Stack

**Frontend**

* React 18
* Vite

**Backend**

* Node.js
* Express
* SQLite
* better-sqlite3

---

## Project Structure

The project is divided into frontend and backend:

```text
clinica-mottura/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## REST API

| Method   | Endpoint                     | Description            |
| -------- | ---------------------------- | ---------------------- |
| `GET`    | `/api/pedidos`               | List and filter orders |
| `GET`    | `/api/pedidos/:id`           | Get a specific order   |
| `POST`   | `/api/pedidos`               | Create an order        |
| `PUT`    | `/api/pedidos/:id`           | Update an order        |
| `PATCH`  | `/api/pedidos/:id/estado`    | Update order status    |
| `POST`   | `/api/pedidos/:id/duplicar`  | Duplicate an order     |
| `DELETE` | `/api/pedidos/:id`           | Delete an order        |
| `GET`    | `/api/pedidos/stats/resumen` | Get dashboard metrics  |
| `GET`    | `/api/meta`                  | Get auxiliary data     |
