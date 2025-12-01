import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { LogOut, FileText, GraduationCap, CheckCircle, Clock, Eye } from 'lucide-react';

const TeacherDashboard = ({ user, onLogout }) => {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [marks, setMarks] = useState('');
  const [remarks, setRemarks] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sheetsRes, studentsRes, examsRes] = await Promise.all([
        axios.get(`${API}/answer-sheets`),
        axios.get(`${API}/students`),
        axios.get(`${API}/exams`),
      ]);

      const teacherEmail = user.email;
      const teacherData = await axios.get(`${API}/teachers`);
      const currentTeacher = teacherData.data.find(t => t.email === teacherEmail);

      if (currentTeacher) {
        const assignedSheets = sheetsRes.data.filter(
          sheet => sheet.assigned_teacher_id === currentTeacher.id
        );
        setAnswerSheets(assignedSheets);
      }

      setStudents(studentsRes.data);
      setExams(examsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getExamDetails = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam ? `${exam.name} (${exam.exam_type})` : 'Unknown';
  };

  const getExamTotalMarks = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam ? exam.total_marks : 0;
  };

  const handleGradeSubmit = async () => {
    if (!marks || parseInt(marks) < 0) {
      toast.error('Please enter valid marks');
      return;
    }

    const totalMarks = getExamTotalMarks(selectedSheet.exam_id);
    if (parseInt(marks) > totalMarks) {
      toast.error(`Marks cannot exceed ${totalMarks}`);
      return;
    }

    setGrading(true);
    try {
      await axios.put(`${API}/answer-sheets/${selectedSheet.id}/grade`, {
        marks_obtained: parseInt(marks),
        remarks: remarks || null,
      });

      toast.success('Marks submitted successfully!');
      setSelectedSheet(null);
      setMarks('');
      setRemarks('');
      fetchData();
    } catch (error) {
      toast.error('Failed to submit marks');
    } finally {
      setGrading(false);
    }
  };

  const handleViewPDF = async (sheetId) => {
    try {
      const response = await axios.get(`${API}/answer-sheets/${sheetId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to open PDF');
    }
  };

  const pendingCount = answerSheets.filter(s => s.status === 'pending').length;
  const checkedCount = answerSheets.filter(s => s.status === 'checked').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50" data-testid="teacher-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 fade-in">
          <Card className="card-hover border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Assigned</p>
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
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
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Answer Sheets List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <CardTitle>Assigned Answer Sheets</CardTitle>
            <CardDescription>Review and grade student submissions</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : answerSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No answer sheets assigned yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Student</th>
                      <th className="text-left py-3 px-4">Exam</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Marks</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answerSheets.map((sheet) => (
                      <tr key={sheet.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{getStudentName(sheet.student_id)}</td>
                        <td className="py-3 px-4 text-gray-600">{getExamDetails(sheet.exam_id)}</td>
                        <td className="py-3 px-4">
                          {sheet.status === 'checked' ? (
                            <span className="badge badge-success">Checked</span>
                          ) : (
                            <span className="badge badge-warning">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sheet.marks_obtained !== null ? (
                            <span className="font-semibold">
                              {sheet.marks_obtained}/{getExamTotalMarks(sheet.exam_id)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not graded</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPDF(sheet.id)}
                              data-testid={`view-pdf-${sheet.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {sheet.status === 'pending' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedSheet(sheet)}
                                    data-testid={`grade-button-${sheet.id}`}
                                  >
                                    Grade
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Grade Answer Sheet</DialogTitle>
                                    <DialogDescription>
                                      Student: {getStudentName(sheet.student_id)} | Exam: {getExamDetails(sheet.exam_id)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="marks">Marks Obtained (out of {getExamTotalMarks(sheet.exam_id)})</Label>
                                      <Input
                                        id="marks"
                                        type="number"
                                        placeholder="Enter marks"
                                        value={marks}
                                        onChange={(e) => setMarks(e.target.value)}
                                        min="0"
                                        max={getExamTotalMarks(sheet.exam_id)}
                                        data-testid="marks-input"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="remarks">Remarks (Optional)</Label>
                                      <Textarea
                                        id="remarks"
                                        placeholder="Enter any remarks or feedback"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        rows={3}
                                        data-testid="remarks-input"
                                      />
                                    </div>
                                    <Button
                                      onClick={handleGradeSubmit}
                                      disabled={grading}
                                      className="w-full"
                                      data-testid="submit-grade-button"
                                    >
                                      {grading ? 'Submitting...' : 'Submit Grade'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

export default TeacherDashboard;