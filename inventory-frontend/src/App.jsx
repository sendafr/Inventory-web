// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Home from "./pages/Home.jsx";
import InventoryForm from "./components/InventoryForm";
import InventoryTable from "./components/InventoryTable";
import Profile from "./pages/Profile.jsx";
import ExcelSheet from "./components/ExcelSheet.jsx";
import BudgetPage from "./components/Budget.jsx";
import Persional_acc from "./components/Persional_acc.jsx";

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const token = localStorage.getItem("access_token");

  return (
    <Router>
      <Routes>
        {/* ─── Public Routes ─────────────────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ─── Protected Routes ──────────────────────────────────────────────── */}
        
        {/* Home */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Inventory Management */}
        <Route
          path="/inventoryForm"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* InventoryTable Management */}
        <Route
          path="/inventoryTable"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryTable />
              </Layout>
            </ProtectedRoute>
          }
        />
       
        {/* Excel Sheet Management */}
        <Route
          path="/excelSheet"
          element={
            <ProtectedRoute>
              <Layout>
                <ExcelSheet />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Budget Page Management */}
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <Layout>
                <BudgetPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Personal Accounting */}
        <Route
          path="/persional_acc"
          element={
            <ProtectedRoute>
              <Layout>
                <Persional_acc />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Catch all - redirect to home or login */}
        <Route 
          path="*" 
          element={<Navigate to={token ? "/" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;