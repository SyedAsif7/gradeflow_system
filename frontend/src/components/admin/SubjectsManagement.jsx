import { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

const CLASS_OPTIONS = [
  // Use a non-empty sentinel value for "all" to satisfy Radix Select requirements
  { value: 'ALL', label: 'All Classes' },
  { value: 'SY-CSE', label: 'Second Year (SY-CSE)' },
  { value: 'TY-CSE', label: 'Third Year (TY-CSE)' },
  { value: 'BTech-CSE', label: 'Final Year (BTech-CSE)' },
];

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    class_name: '',
  });

  const classOptions = CLASS_OPTIONS;

  const getClassLabel = (value) =>
    classOptions.find((option) => option.value === value)?.label || 'All Classes';

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await api.put(`/subjects/${currentSubject.id}`, formData);
        toast.success('Subject updated successfully!');
      } else {
        await api.post('/subjects', formData);
        toast.success('Subject created successfully!');
      }

      fetchSubjects();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const handleEdit = (subject) => {
    setEditMode(true);
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      class_name: subject.class_name || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentSubject(null);
    setFormData({
      name: '',
      code: '',
      class_name: '',
    });
  };

  const filteredSubjects = useMemo(() => {
    // Treat both empty string and the sentinel "ALL" as "no filter"
    if (!classFilter || classFilter === 'ALL') {
      return subjects;
    }
    return subjects.filter((subject) => (subject.class_name || '') === classFilter);
  }, [subjects, classFilter]);

  const classSummary = useMemo(
    () =>
      classOptions
        // Exclude the "ALL" option from per-class summaries
        .filter((option) => option.value && option.value !== 'ALL')
        .map((option) => ({
          ...option,
          count: subjects.filter((subject) => subject.class_name === option.value).length,
        })),
    [subjects]
  );

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Subjects Management</h2>
          <p className="text-sm text-gray-500">Monitor and organize subjects class-wise</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditMode(false)} data-testid="add-subject-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                <DialogDescription>
                  {editMode ? 'Update subject information' : 'Create a new subject'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Mathematics, Physics"
                    data-testid="subject-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="e.g., MATH101, PHY201"
                    data-testid="subject-code-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class/Year (Optional)</Label>
                  <Select
                    value={formData.class_name}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        // Map sentinel "ALL" back to an empty string since class is optional
                        class_name: value === 'ALL' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger id="class_name">
                      <SelectValue placeholder="Select Year (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Use non-empty value for "All Years" to satisfy Radix Select */}
                      <SelectItem value="ALL">All Years</SelectItem>
                      <SelectItem value="SY-CSE">Second Year (SY-CSE)</SelectItem>
                      <SelectItem value="TY-CSE">Third Year (TY-CSE)</SelectItem>
                      <SelectItem value="BTech-CSE">Final Year (BTech-CSE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-subject-button">
                  {editMode ? 'Update Subject' : 'Create Subject'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        {classSummary.map((item) => (
          <div key={item.value} className="rounded-lg border p-4 bg-gray-50">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-semibold mt-1">{item.count}</p>
            <p className="text-xs text-gray-400 mt-1">Subjects mapped</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {classFilter
              ? `No subjects found for ${getClassLabel(classFilter)}`
              : 'No subjects found. Add your first subject!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <div className="flex justify-between items-center px-4 pt-4 text-sm text-gray-500">
            <span>{filteredSubjects.length} subjects</span>
            <span>{getClassLabel(classFilter)}</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Subject Name</th>
                <th className="text-left py-3 px-4">Subject Code</th>
                <th className="text-left py-3 px-4">Class/Year</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject) => (
                <tr key={subject.id} className="border-b">
                  <td className="py-3 px-4 font-medium">{subject.name}</td>
                  <td className="py-3 px-4 text-gray-600">{subject.code}</td>
                  <td className="py-3 px-4 text-gray-600">{subject.class_name || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(subject)}
                        data-testid={`edit-subject-${subject.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(subject.id)}
                        data-testid={`delete-subject-${subject.id}`}
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

export default SubjectsManagement;