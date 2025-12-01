import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Eye, UserCheck } from 'lucide-react';

const AnswerSheetsManagement = ({ onUpdate }) => {
  const [answerSheets, setAnswerSheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    exam_id: '',
    student_id: '',
    assigned_teacher_id: '',
    file: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sheetsRes, studentsRes, teachersRes, examsRes, subjectsRes] = await Promise.all([
        axios.get(`${API}/answer-sheets`),
        axios.get(`${API}/students`),
        axios.get(`${API}/teachers`),
        axios.get(`${API}/exams`),
        axios.get(`${API}/subjects`),
      ]);
      setAnswerSheets(sheetsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.file) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('exam_id', formData.exam_id);
      formDataToSend.append('student_id', formData.student_id);
      if (formData.assigned_teacher_id) {
        formDataToSend.append('assigned_teacher_id', formData.assigned_teacher_id);
      }
      formDataToSend.append('file', formData.file);

      await axios.post(`${API}/answer-sheets/upload`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Answer sheet uploaded successfully!');
      fetchData();
      if (onUpdate) onUpdate();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignTeacher = async (teacherId) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('teacher_id', teacherId);

      await axios.put(`${API}/answer-sheets/${selectedSheet.id}/assign`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Teacher assigned successfully!');
      fetchData();
      if (onUpdate) onUpdate();
      setAssignDialogOpen(false);
      setSelectedSheet(null);
    } catch (error) {
      toast.error('Failed to assign teacher');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this answer sheet?')) return;

    try {
      await axios.delete(`${API}/answer-sheets/${id}`);
      toast.success('Answer sheet deleted successfully!');
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to delete answer sheet');
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

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      exam_id: '',
      student_id: '',
      assigned_teacher_id: '',
      file: null,
    });
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getExamName = (examId) => {
    const exam = exams.find((e) => e.id === examId);
    return exam ? exam.name : 'Unknown';
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'Not assigned';
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Answer Sheets Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="upload-answer-sheet-button">
              <Upload className="w-4 h-4 mr-2" />
              Upload Answer Sheet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Answer Sheet</DialogTitle>
              <DialogDescription>Upload a student's answer sheet (PDF only)</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exam">Exam</Label>
                <Select
                  value={formData.exam_id}
                  onValueChange={(value) => setFormData({ ...formData, exam_id: value })}
                  required
                >
                  <SelectTrigger data-testid="answer-sheet-exam-select">
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name} ({exam.exam_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  required
                >
                  <SelectTrigger data-testid="answer-sheet-student-select">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.roll_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Assign to Teacher (Optional)</Label>
                <Select
                  value={formData.assigned_teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, assigned_teacher_id: value })}
                >
                  <SelectTrigger data-testid="answer-sheet-teacher-select">
                    <SelectValue placeholder="Select teacher (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  required
                  data-testid="answer-sheet-file-input"
                />
              </div>
              <Button type="submit" className="w-full" disabled={uploading} data-testid="submit-answer-sheet-button">
                {uploading ? 'Uploading...' : 'Upload Answer Sheet'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : answerSheets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No answer sheets uploaded yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Exam</th>
                <th className="text-left py-3 px-4">Assigned Teacher</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Marks</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {answerSheets.map((sheet) => (
                <tr key={sheet.id} className="border-b">
                  <td className="py-3 px-4 font-medium">{getStudentName(sheet.student_id)}</td>
                  <td className="py-3 px-4 text-gray-600">{getExamName(sheet.exam_id)}</td>
                  <td className="py-3 px-4 text-gray-600">{getTeacherName(sheet.assigned_teacher_id)}</td>
                  <td className="py-3 px-4">
                    {sheet.status === 'checked' ? (
                      <span className="badge badge-success">Checked</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {sheet.marks_obtained !== null ? sheet.marks_obtained : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPDF(sheet.id)}
                        data-testid={`view-answer-sheet-${sheet.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Dialog open={assignDialogOpen && selectedSheet?.id === sheet.id} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSheet(sheet)}
                            data-testid={`assign-teacher-${sheet.id}`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Teacher</DialogTitle>
                            <DialogDescription>
                              Select a teacher to grade this answer sheet
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select onValueChange={handleAssignTeacher}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(sheet.id)}
                        data-testid={`delete-answer-sheet-${sheet.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnswerSheetsManagement;