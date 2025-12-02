import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, User } from 'lucide-react';

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('SY');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_number: '',
    class_name: '',
    prn: '',
    semester: '',
    academic_year: '',
    password: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (class_name = null) => {
    try {
      const params = class_name && class_name !== 'all' ? { class_name } : {};
      const response = await api.get('/students', { params });
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await api.put(`/students/${currentStudent.id}`, formData);
        toast.success('Student updated successfully!');
      } else {
        await api.post('/students', formData);
        toast.success('Student created successfully!');
      }

      fetchStudents();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully!');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleEdit = (student) => {
    setEditMode(true);
    setCurrentStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      roll_number: student.roll_number,
      class_name: student.class_name,
      prn: student.prn || '',
      semester: student.semester || '',
      academic_year: student.academic_year || '',
      password: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentStudent(null);
    setFormData({
      name: '',
      email: '',
      roll_number: '',
      class_name: '',
      prn: '',
      semester: '',
      academic_year: '',
      password: '',
    });
  };

  // Group students by year
  const syStudents = students.filter(s => s.class_name === 'SY');
  const tyStudents = students.filter(s => s.class_name === 'TY');
  const beStudents = students.filter(s => s.class_name === 'BE' || s.class_name === 'BE(CSE)');

  const renderStudentTable = (studentList) => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (studentList.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No students found for this year.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Roll Number</th>
              <th className="text-left py-3 px-4">PRN</th>
              <th className="text-left py-3 px-4">Class/Year</th>
              <th className="text-left py-3 px-4">Semester</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {studentList.map((student) => (
              <tr key={student.id} className="border-b">
                <td className="py-3 px-4 font-medium">{student.name}</td>
                <td className="py-3 px-4 text-gray-600">{student.email}</td>
                <td className="py-3 px-4 text-gray-600">{student.roll_number}</td>
                <td className="py-3 px-4 text-gray-600">{student.prn || '-'}</td>
                <td className="py-3 px-4 text-gray-600">{student.class_name}</td>
                <td className="py-3 px-4 text-gray-600">{student.semester || '-'}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(student)}
                      data-testid={`edit-student-${student.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(student.id)}
                      data-testid={`delete-student-${student.id}`}
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
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Students Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditMode(false)} data-testid="add-student-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogDescription>
                  {editMode ? 'Update student information' : 'Create a new student account'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="student-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="student-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roll_number">Roll Number</Label>
                  <Input
                    id="roll_number"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    required
                    data-testid="student-roll-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class/Year</Label>
                  <Select
                    value={formData.class_name}
                    onValueChange={(value) => setFormData({ ...formData, class_name: value })}
                    required
                  >
                    <SelectTrigger id="class_name" data-testid="student-class-input">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SY">Second Year (SY)</SelectItem>
                      <SelectItem value="TY">Third Year (TY)</SelectItem>
                      <SelectItem value="BE">Final Year (BE)</SelectItem>
                      <SelectItem value="BE(CSE)">Final Year BE(CSE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prn">PRN (Optional)</Label>
                  <Input
                    id="prn"
                    type="number"
                    value={formData.prn}
                    onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
                    placeholder="Permanent Registration Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester (Optional)</Label>
                  <Input
                    id="semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    placeholder="e.g., SEM-3, SEM-5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year (Optional)</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="e.g., 2025-26"
                  />
                </div>
                {!editMode && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      data-testid="student-password-input"
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" data-testid="submit-student-button">
                  {editMode ? 'Update Student' : 'Create Student'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Tabs value={selectedClass} onValueChange={setSelectedClass} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="SY">Second Year (SY)</TabsTrigger>
          <TabsTrigger value="TY">Third Year (TY)</TabsTrigger>
          <TabsTrigger value="BE">Final Year (BE)</TabsTrigger>
        </TabsList>

        <TabsContent value="SY" className="mt-0">
          {renderStudentTable(syStudents)}
        </TabsContent>

        <TabsContent value="TY" className="mt-0">
          {renderStudentTable(tyStudents)}
        </TabsContent>

        <TabsContent value="BE" className="mt-0">
          {renderStudentTable(beStudents)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentsManagement;