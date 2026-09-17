import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
// AuthProvider por fora: o DataProvider precisa saber quem está logado para
// decidir quais rotas da API pode chamar (aluno x admin/mentor).
import { AuthProvider } from "./store/AuthContext";
import { DataProvider } from "./store/DataContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { InscricaoPage } from "./pages/InscricaoPage";
import { AdminLayout } from "./layouts/AdminLayout";
import { AlunoLayout } from "./layouts/AlunoLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminEquipesPage } from "./pages/admin/AdminEquipesPage";
import { AdminEquipeDetalhePage } from "./pages/admin/AdminEquipeDetalhePage";
import { AdminTarefasPage } from "./pages/admin/AdminTarefasPage";
import { AdminRelatoriosPage } from "./pages/admin/AdminRelatoriosPage";
import { AlunoDashboardPage } from "./pages/aluno/AlunoDashboardPage";
import { AlunoTarefasPage } from "./pages/aluno/AlunoTarefasPage";
import { AlunoTarefaDetalhePage } from "./pages/aluno/AlunoTarefaDetalhePage";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/inscricao" element={<InscricaoPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute perfis={["admin", "mentor"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="equipes" element={<AdminEquipesPage />} />
              <Route path="equipes/:id" element={<AdminEquipeDetalhePage />} />
              <Route path="tarefas" element={<AdminTarefasPage />} />
              <Route path="relatorios" element={<AdminRelatoriosPage />} />
            </Route>

            <Route
              path="/aluno"
              element={
                <ProtectedRoute perfis={["aluno"]}>
                  <AlunoLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AlunoDashboardPage />} />
              <Route path="tarefas" element={<AlunoTarefasPage />} />
              <Route path="tarefas/:id" element={<AlunoTarefaDetalhePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
