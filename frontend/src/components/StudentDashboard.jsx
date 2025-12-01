import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { LogOut, FileText, GraduationCap, TrendingUp, Award } from 'lucide-react';

const StudentDashboard = ({ user, onLogout }) => {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, examsRes, subjectsRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/exams`),
        axios.get(`${API}/subjects`),
      ]);

      const currentStudent = studentsRes.data.find(s => s.email === user.email);
      if (currentStudent) {
        setStudentData(currentStudent);
        const sheetsRes = await axios.get(`${API}/answer-sheets?student_id=${currentStudent.id}`);
        setAnswerSheets(sheetsRes.data);
      }

      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getExamDetails = (examId) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return { name: 'Unknown', type: '', totalMarks: 0, subjectName: '' };

    const subject = subjects.find(s => s.id === exam.subject_id);
    return {
      name: exam.name,
      type: exam.exam_type,
      totalMarks: exam.total_marks,
      subjectName: subject ? subject.name : 'Unknown',
    };
  };

  const calculateStats = () => {
    const checkedSheets = answerSheets.filter(s => s.status === 'checked');
    if (checkedSheets.length === 0) return { average: 0, total: 0, percentage: 0 };

    const totalMarks = checkedSheets.reduce((sum, sheet) => {
      return sum + (sheet.marks_obtained || 0);
    }, 0);

    const totalPossible = checkedSheets.reduce((sum, sheet) => {
      const exam = exams.find(e => e.id === sheet.exam_id);
      return sum + (exam ? exam.total_marks : 0);
    }, 0);

    return {
      average: checkedSheets.length > 0 ? (totalMarks / checkedSheets.length).toFixed(2) : 0,
      total: totalMarks,
      percentage: totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0,
    };
  };

  const stats = calculateStats();
  const checkedCount = answerSheets.filter(s => s.status === 'checked').length;
  const pendingCount = answerSheets.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-teal-50" data-testid="student-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
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
        {/* Student Info */}
        {studentData && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{studentData.name}</h2>
                  <p className="text-green-100">Roll Number: {studentData.roll_number}</p>
                  <p className="text-green-100">Class: {studentData.class_name}</p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Award className="w-12 h-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 fade-in">
          <Card className="card-hover border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Exams</p>
                  <p className="text-3xl font-bold text-gray-900">{answerSheets.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Checked</p>
                  <p className="text-3xl font-bold text-green-600">{checkedCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Average Marks</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.average}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Overall %</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.percentage}%</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <CardTitle>My Results</CardTitle>
            <CardDescription>View your exam marks and feedback</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : answerSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No exam results available yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Exam</th>
                      <th className="text-left py-3 px-4">Subject</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Marks</th>
                      <th className="text-left py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answerSheets.map((sheet) => {
                      const examDetails = getExamDetails(sheet.exam_id);
                      return (
                        <tr key={sheet.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{examDetails.name}</td>
                          <td className="py-3 px-4 text-gray-600">{examDetails.subjectName}</td>
                          <td className="py-3 px-4">
                            <span className="badge badge-info">{examDetails.type}</span>
                          </td>
                          <td className="py-3 px-4">
                            {sheet.status === 'checked' ? (
                              <span className="badge badge-success">Checked</span>
                            ) : (
                              <span className="badge badge-warning">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {sheet.marks_obtained !== null ? (
                              <span className="font-semibold text-lg">
                                {sheet.marks_obtained}/{examDetails.totalMarks}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not graded</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {sheet.remarks || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;