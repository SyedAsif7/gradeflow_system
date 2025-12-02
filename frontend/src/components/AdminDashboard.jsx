import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { LogOut, Users, BookOpen, FileText, GraduationCap, UserCheck, BarChart3 } from 'lucide-react';
import StudentsManagement from './admin/StudentsManagement';
import TeachersManagement from './admin/TeachersManagement';
import SubjectsManagement from './admin/SubjectsManagement';
import ExamsManagement from './admin/ExamsManagement';
import AnswerSheetsManagement from './admin/AnswerSheetsManagement';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Students', value: stats?.students || 0, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total Teachers', value: stats?.teachers || 0, icon: UserCheck, color: 'from-purple-500 to-pink-500' },
    { title: 'Subjects', value: stats?.subjects || 0, icon: BookOpen, color: 'from-green-500 to-emerald-500' },
    { title: 'Exams', value: stats?.exams || 0, icon: FileText, color: 'from-orange-500 to-red-500' },
    { title: 'Answer Sheets', value: stats?.answer_sheets || 0, icon: GraduationCap, color: 'from-indigo-500 to-blue-500' },
    { title: 'Pending Checks', value: stats?.pending_sheets || 0, icon: BarChart3, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 fade-in">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="card-hover border-0 shadow-md bg-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Management Tabs */}
        <Card className="border-0 shadow-lg">
          <Tabs defaultValue="students" className="w-full">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100">
                <TabsTrigger value="students" data-testid="students-tab">Students</TabsTrigger>
                <TabsTrigger value="teachers" data-testid="teachers-tab">Teachers</TabsTrigger>
                <TabsTrigger value="subjects" data-testid="subjects-tab">Subjects</TabsTrigger>
                <TabsTrigger value="exams" data-testid="exams-tab">Exams</TabsTrigger>
                <TabsTrigger value="answer-sheets" data-testid="answer-sheets-tab">Answer Sheets</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="students" className="mt-0">
                <StudentsManagement />
              </TabsContent>
              <TabsContent value="teachers" className="mt-0">
                <TeachersManagement />
              </TabsContent>
              <TabsContent value="subjects" className="mt-0">
                <SubjectsManagement />
              </TabsContent>
              <TabsContent value="exams" className="mt-0">
                <ExamsManagement />
              </TabsContent>
              <TabsContent value="answer-sheets" className="mt-0">
                <AnswerSheetsManagement onUpdate={fetchStats} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;