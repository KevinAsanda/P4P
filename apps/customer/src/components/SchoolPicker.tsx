'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

interface TemplateInfo {
  id: string;
  gradeLevel: string;
  academicYear: number;
}

interface SchoolWithTemplates {
  id: string;
  name: string;
  region: string;
  templates: TemplateInfo[];
}

interface SchoolPickerProps {
  schools: SchoolWithTemplates[];
}

export default function SchoolPicker({ schools }: SchoolPickerProps) {
  const router = useRouter();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const availableTemplates = selectedSchool?.templates || [];

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSchoolId(e.target.value);
    setSelectedTemplateId('');
  };

  const handleProceed = () => {
    if (selectedTemplateId) {
      router.push(`/templates/${selectedTemplateId}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-xl space-y-6">
      <h2 className="text-xl font-extrabold text-jetblack flex items-center gap-2">
        <BookOpen className="text-papaya h-5 w-5 fill-papaya/20" />
        Find Your School List
      </h2>
      <p className="text-sm text-gray-500">
        Select your child's school and grade below. We'll automatically load the required list.
      </p>

      <div className="space-y-4">
        {/* School Dropdown */}
        <div className="space-y-2">
          <label htmlFor="school-select" className="block text-sm font-semibold text-gray-600">
            1. Select School
          </label>
          <div className="relative">
            <select
              id="school-select"
              value={selectedSchoolId}
              onChange={handleSchoolChange}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-jetblack font-medium transition-all focus:border-papaya focus:bg-white focus:outline-none focus:ring-2 focus:ring-papaya/20"
            >
              <option value="">-- Choose a Durban school --</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.region})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400" aria-hidden="true"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
          </div>
        </div>

        {/* Grade Dropdown */}
        <div className="space-y-2">
          <label htmlFor="grade-select" className="block text-sm font-semibold text-gray-600">
            2. Select Grade
          </label>
          <div className="relative">
            <select
              id="grade-select"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={!selectedSchoolId}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-jetblack font-medium transition-all focus:border-papaya focus:bg-white focus:outline-none focus:ring-2 focus:ring-papaya/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {!selectedSchoolId ? 'Select a school first' : '-- Select grade level --'}
              </option>
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.gradeLevel} ({tpl.academicYear} List)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400" aria-hidden="true"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
          </div>
        </div>
      </div>

      <button
        type="button"
        id="btn-load-list"
        onClick={handleProceed}
        disabled={!selectedTemplateId}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-jetblack py-3.5 px-6 font-bold text-white transition-all hover:bg-caramel hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-jetblack disabled:hover:shadow-none"
      >
        <span>Get Stationery Pack</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
