import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { LogOut, FileText, GraduationCap, CheckCircle, Clock, Eye, Search, Filter, Download, Save } from 'lucide-react';
import PdfViewer from './PdfViewer';

const TeacherDashboard = ({ user, onLogout }) => {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [questionMarks, setQuestionMarks] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [grading, setGrading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExam, setFilterExam] = useState('all');
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sheetsRes, studentsRes, examsRes, subjectsRes] = await Promise.all([
        api.get('/answer-sheets'),
        api.get('/students'),
        api.get('/exams'),
        api.get('/subjects'),
      ]);

      const teacherEmail = user.email;
      const teacherData = await api.get('/teachers');
      const currentTeacher = teacherData.data.find(t => t.email === teacherEmail);

      if (currentTeacher) {
        const assignedSheets = sheetsRes.data.filter(
          sheet => sheet.assigned_teacher_id === currentTeacher.id
        );
        setAnswerSheets(assignedSheets);
      }

      setStudents(studentsRes.data);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
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

  const getStudentRollNumber = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.roll_number : 'N/A';
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

  const getExamQuestions = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam && Array.isArray(exam.questions) ? exam.questions : [];
  };

  const handleOpenGrade = (sheet) => {
    setSelectedSheet(sheet);
    const questions = getExamQuestions(sheet.exam_id);
    
    // Initialize marks from existing data or create new
    if (sheet.question_marks && sheet.question_marks.length > 0) {
      setQuestionMarks(sheet.question_marks.map(qm => ({
        question_number: qm.question_number,
        max_marks: qm.max_marks,
        marks_obtained: qm.marks_obtained || 0,
      })));
    } else {
      const initialMarks = questions.map((q) => ({
        question_number: q.question_number,
        max_marks: q.max_marks,
        marks_obtained: 0,
      }));
      setQuestionMarks(initialMarks);
    }
    
    setRemarks(sheet.remarks || '');
    setGradingDialogOpen(true);
  };

  const handleQuestionMarkChange = (index, value) => {
    setQuestionMarks((prev) => {
      const next = [...prev];
      const parsed = parseFloat(value || '0');
      const maxMarks = next[index].max_marks;
      const marksObtained = isNaN(parsed) ? 0 : Math.max(0, Math.min(maxMarks, parsed));
      next[index] = { ...next[index], marks_obtained: marksObtained };
      return next;
    });
  };

  const totalObtained = questionMarks.reduce((sum, q) => sum + (q.marks_obtained || 0), 0);
  const totalMax = questionMarks.reduce((sum, q) => sum + (q.max_marks || 0), 0);

  const handleGradeSubmit = async () => {
    if (!selectedSheet) return;

    if (!questionMarks.length) {
      toast.error('No questions configured for this exam.');
      return;
    }

    // Validate marks
    for (const qm of questionMarks) {
      if (qm.marks_obtained < 0 || qm.marks_obtained > qm.max_marks) {
        toast.error(`Marks for question ${qm.question_number} must be between 0 and ${qm.max_marks}`);
        return;
      }
    }

    setGrading(true);
    try {
      await api.put(`/answer-sheets/${selectedSheet.id}/grade`, {
        question_marks: questionMarks,
        remarks: remarks || null,
      });

      toast.success('Marks submitted successfully!');
      setGradingDialogOpen(false);
      setSelectedSheet(null);
      setQuestionMarks([]);
      setRemarks('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit marks');
    } finally {
      setGrading(false);
    }
  };

  const handleDownloadPDF = async (sheetId) => {
    try {
      const response = await api.get(`/answer-sheets/${sheetId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `answer-sheet-${sheetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  // Filter and search logic
  const filteredSheets = answerSheets.filter(sheet => {
    const studentName = getStudentName(sheet.student_id).toLowerCase();
    const rollNumber = getStudentRollNumber(sheet.student_id).toLowerCase();
    const examDetails = getExamDetails(sheet.exam_id);
    const examName = examDetails.name.toLowerCase();
    const subjectName = examDetails.subjectName.toLowerCase();
    
    const matchesSearch = searchTerm === '' || 
      studentName.includes(searchTerm.toLowerCase()) ||
      rollNumber.includes(searchTerm.toLowerCase()) ||
      examName.includes(searchTerm.toLowerCase()) ||
      subjectName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sheet.status === filterStatus;
    const matchesExam = filterExam === 'all' || sheet.exam_id === filterExam;
    
    return matchesSearch && matchesStatus && matchesExam;
  });

  const pendingSheets = filteredSheets.filter(s => s.status === 'pending');
  const checkedSheets = filteredSheets.filter(s => s.status === 'checked');

  const pendingCount = answerSheets.filter(s => s.status === 'pending').length;
  const checkedCount = answerSheets.filter(s => s.status === 'checked').length;
  const totalCount = answerSheets.length;

  const renderAnswerSheetRow = (sheet) => {
    const examDetails = getExamDetails(sheet.exam_id);
    const studentName = getStudentName(sheet.student_id);
    const rollNumber = getStudentRollNumber(sheet.student_id);

    return (
      <tr key={sheet.id} className="border-b hover:bg-gray-50 transition-colors">
        <td className="py-4 px-4">
          <div>
            <div className="font-medium text-gray-900">{studentName}</div>
            <div className="text-sm text-gray-500">Roll: {rollNumber}</div>
          </div>
        </td>
        <td className="py-4 px-4">
          <div>
            <div className="font-medium text-gray-900">{examDetails.subjectName}</div>
            <div className="text-sm text-gray-500">{examDetails.name}</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">{examDetails.type}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          {sheet.status === 'checked' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Checked
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </span>
          )}
        </td>
        <td className="py-4 px-4">
          {sheet.marks_obtained !== null && sheet.marks_obtained !== undefined ? (
            <div className="font-semibold text-gray-900">
              {sheet.marks_obtained} / {examDetails.totalMarks}
              <div className="text-xs text-gray-500 mt-1">
                {((sheet.marks_obtained / examDetails.totalMarks) * 100).toFixed(1)}%
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Not graded</span>
          )}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPDF(sheet.id)}
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenGrade(sheet)}
              title={sheet.status === 'checked' ? 'View/Edit Grade' : 'Grade Paper'}
            >
              <Eye className="w-4 h-4 mr-1" />
              {sheet.status === 'checked' ? 'View' : 'Grade'}
            </Button>
          </div>
        </td>
      </tr>
    );
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Paper Checking Dashboard</h1>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Assigned</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
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

          <Card className="border-0 shadow-md bg-white">
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

        {/* Answer Sheets Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Answer Sheets</CardTitle>
                <CardDescription>Review and grade student submissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student name, roll number, exam, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterExam} onValueChange={setFilterExam}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name} ({exam.exam_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No answer sheets found</p>
              </div>
            ) : (
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="pending">
                    Pending ({pendingSheets.length})
                  </TabsTrigger>
                  <TabsTrigger value="checked">
                    Checked ({checkedSheets.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold">Student</th>
                          <th className="text-left py-3 px-4 font-semibold">Exam</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Marks</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSheets.map(renderAnswerSheetRow)}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="checked" className="mt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold">Student</th>
                          <th className="text-left py-3 px-4 font-semibold">Exam</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Marks</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkedSheets.map(renderAnswerSheetRow)}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Answer Sheet</DialogTitle>
            <DialogDescription>
              {selectedSheet && (
                <>
                  Student: <strong>{getStudentName(selectedSheet.student_id)}</strong> ({getStudentRollNumber(selectedSheet.student_id)}) | 
                  Exam: <strong>{getExamDetails(selectedSheet.exam_id).name}</strong> ({getExamDetails(selectedSheet.exam_id).type})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSheet && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* PDF Viewer */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Answer Sheet</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPDF(selectedSheet.id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ minHeight: '500px' }}>
                  <PdfViewer sheetId={selectedSheet.id} />
                </div>
              </div>

              {/* Grading Panel */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Question-wise Marks</h3>
                    <div className="text-sm text-gray-600">
                      Total: <span className="font-bold text-lg">{totalObtained}</span> / <span className="font-bold">{totalMax || getExamDetails(selectedSheet.exam_id).totalMarks}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {questionMarks.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No questions configured for this exam</p>
                    ) : (
                      questionMarks.map((qm, idx) => (
                        <div key={qm.question_number} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">
                              Question {qm.question_number}
                            </Label>
                            <div className="text-xs text-gray-500 mt-1">
                              Max Marks: {qm.max_marks}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              className="w-24 h-10 text-center font-semibold"
                              min="0"
                              max={qm.max_marks}
                              step="0.5"
                              value={qm.marks_obtained}
                              onChange={(e) => handleQuestionMarkChange(idx, e.target.value)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (isNaN(val) || val < 0) {
                                  handleQuestionMarkChange(idx, '0');
                                } else if (val > qm.max_marks) {
                                  handleQuestionMarkChange(idx, qm.max_marks.toString());
                                }
                              }}
                            />
                            <span className="text-gray-500">/ {qm.max_marks}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total Marks Display */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total Marks:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {totalObtained} / {totalMax || getExamDetails(selectedSheet.exam_id).totalMarks}
                      </span>
                    </div>
                    {totalMax > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Percentage: <strong>{((totalObtained / totalMax) * 100).toFixed(1)}%</strong>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks / Feedback (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Enter any remarks, feedback, or comments for the student..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={handleGradeSubmit}
                      disabled={grading || questionMarks.length === 0}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {grading ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {selectedSheet.status === 'checked' ? 'Update Grade' : 'Submit Grade'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGradingDialogOpen(false)}
                      disabled={grading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;
