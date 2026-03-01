# Gym Manager

A comprehensive, full-stack membership and facility management system purpose-built for gyms and fitness centers. 

## 🚀 Features

*   **Member Management:** Complete CRUD operations for members, including capturing additional details (address, emergency contact, blood group), profile views, and calculating membership validity.
*   **Payments & Billing (Cash-Only Focus):** Record manual payments, auto-generate sequential invoices (INV-YYYY-XXXX), and download customized PDF receipts. Includes integrated GST back-calculation support.
*   **Point of Sale (POS):** A built-in cart system to ring up custom items, merchandise, and supplements alongside memberships.
*   **Class Scheduling & Bookings:** Create dynamic recurring classes, assign trainers, set capacity limits, and allow staff to book members in advance.
*   **Attendance & Quick Check-ins:** Fast verification interface to check members in (via UI search or QR-code integration), warning staff of expired memberships.
*   **Automated WhatsApp Integration:** Seamlessly connect via WhatsApp Web JS to fire automated messages (welcome messages, payment receipts, expiry reminders, and bulk announcements) without relying on expensive official API bills.
*   **Role-Based Access Control:** Differentiated access for Owners, Admins, Trainers, and basic Staff members.
*   **Performance Metrics:** Intuitive dashboard with KPI stats, membership trends, and revenue charts powered by Recharts.
*   **Dark Mode Ready:** First-class dark mode support persisting via local storage.

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router v6.
*   **Backend:** Node.js, Express, TypeScript.
*   **Database:** SQLite (local lightweight persistent storage) using `better-sqlite3`.
*   **Communication:** `whatsapp-web.js` for headless WhatsApp automation via Puppeteer.

## 💻 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+ recommended)
*   npm

### Installation & Run Instructions

1.  **Clone the repository & install dependencies**
    ```bash
    git clone <repository-url>
    cd Gym-Manager
    npm install
    ```

2.  **Environment Setup**
    *   Create a `.env` file in the root directory based on `.env.example` (if provided).
    *   Set `VITE_API_URL=http://localhost:3000` to connect the React frontend to the local Express backend.

3.  **Start the Application**
    *   The project uses `concurrently` to run both the Vite frontend and Express backend simultaneously.
    ```bash
    npm run dev
    ```
    *   Frontend will be available at `http://localhost:5173/`
    *   Backend API will be running at `http://localhost:3000/api`

4.  **Initial Authentication**
    *   Log in initially using the generic admin credentials defined or created within the application setup.
    *   *Default (if configured):* Username: `admin`, Password: `admin`

5.  **WhatsApp Linking**
    *   Navigate to the **Settings** tab.
    *   Scan the generated QR code with the "Linked Devices" section of your Gym's official WhatsApp account.

## 🤝 Contributing
Open to internal pull requests and feature expansions. Ensure tests pass before pushing to the `main` branch.
