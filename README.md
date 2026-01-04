
***

# STA - Advanced Stock Management

![STA Logo](public/logosta.jpg)

**STA** is a comprehensive and modern web application designed for advanced stock management, sales, and business operations. It offers an intuitive interface and powerful features to optimize workflows, from product reception to customer invoicing.

## ✨ Features

- **Intuitive Dashboard**: Visualize Key Performance Indicators (KPIs) such as total stock value, low stock alerts, and recent activity at a glance. The dashboard is personalized based on the user's role (Admin, Warehouse Manager, etc.).
- **Product & Catalog Management**: Easily create, edit, and organize your products with rich details (prices, references, alert thresholds, price per carton, etc.).
- **Point of Sale (POS)**: A fast and ergonomic checkout interface to record direct sales, featuring an interactive cart, customer management, and options for credit sales.
- **Multi-Warehouse Stock Management**: Track real-time stock levels for each product across different storage locations (stores, warehouses).
- **Internal Order System**: Manage product requests between different departments or internal clients, with a complete validation workflow.
- **Automated Invoicing & Delivery Notes**: Automatically generate professional invoices and delivery notes from validated orders.
- **Inventory & Replenishment**: Conduct precise inventories (via scan or import) to calculate discrepancies, and easily record new stock arrivals to update quantities.
- **Role & Permission Management**: A flexible Role-Based Access Control (RBAC) system to define granular permissions for each user (e.g., Admin, Secretary, Warehouse Manager, Shopkeeper).
- **Data Management**: Dedicated interfaces to manage clients, product categories, and stock locations.
- **Action Log**: Track all significant actions performed within the system through a searchable and filterable event log.
- **Real-Time Notifications**: Stay informed of important events (new orders, validations) via push notifications over WebSockets.
- **Customization**: Adapt the application to your company's brand by modifying organization details and theme colors.
- **Import/Export**: Import product lists from Excel files and print barcode labels in bulk.

## 🚀 Technologies Used

This project is built with a modern, high-performance, and maintainable architecture.

- **Frontend Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **State Management**: React Context API & Hooks
- **Real-Time Communication**: WebSockets (with STOMP.js and SockJS)
- **Form Validation**: React Hook Form & Zod
- **Backend (API)**: The application communicates with an external RESTful API (not included in this repository).

## ⚙️ Getting Started

Follow these steps to launch the application in a development environment.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd <folder-name>
npm install
```

### 2. Environment Configuration

Create a `.env.local` file at the root of the project to configure the backend API and WebSocket server URLs.

```env
# Base URL of your backend API
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# URL of your WebSocket server
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws-notifications
```

### 3. Run the Development Server

You can now launch the application:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

## 📄 Available Scripts

- `npm run dev`: Runs the application in development mode with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Runs ESLint for code analysis.
- `npm run typecheck`: Checks TypeScript types without emitting files.

---
